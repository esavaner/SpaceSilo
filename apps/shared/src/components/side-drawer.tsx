import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import styled from 'styled-components/native';
import { theme } from '../config/theme';
import { modalBackdropStyle, useWebScrollLock } from './component-utils';

const Frame = styled.View`
  flex: 1;
  flex-direction: row;
`;

const Content = styled.View`
  flex: 1;
  min-width: 0;
`;

const Panel = styled.View`
  flex: 1;
  background-color: ${theme.colors.surface.default};
`;

type Side = 'left' | 'right';

type DrawerPanelProps = {
  /** Set the initial value and wire any triggers in the caller. */
  open: boolean;
  side: Side;
  width: number;
  panel: ReactNode;
};

export type SideDrawerProps = Pick<DrawerPanelProps, 'open' | 'panel'> &
  Partial<Pick<DrawerPanelProps, 'side' | 'width'>> & { children?: ReactNode } & (
    { mode?: 'push'; onClose?: () => void } | { mode: 'overlay'; onClose: () => void }
  );

const useDrawerProgress = (open: boolean, ready: boolean, initial: number, setPresent: (present: boolean) => void) => {
  const progress = useSharedValue(initial);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const hide = () => {
      if (active) setPresent(false);
    };
    progress.value = withTiming(open ? 1 : 0, { duration: 250 }, (finished) => {
      if (finished && !open) scheduleOnRN(hide);
    });
    return () => {
      active = false;
      cancelAnimation(progress);
    };
  }, [open, progress, ready, setPresent]);
  return progress;
};

const PushPanel = ({ open, side, width, panel }: DrawerPanelProps) => {
  const [present, setPresent] = useState(open);
  useEffect(() => {
    if (open) setPresent(true);
  }, [open]);
  const progress = useDrawerProgress(open, open || present, open ? 1 : 0, setPresent);
  const size = useAnimatedStyle(() => ({ width: width * progress.value }));

  return open || present ? (
    <Animated.View
      style={[styles.pushClip, size]}
      pointerEvents={open ? 'auto' : 'none'}
      aria-hidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
    >
      <View style={[styles.panel, { width, [side === 'left' ? 'right' : 'left']: 0 }]}>
        <Panel>{panel}</Panel>
      </View>
    </Animated.View>
  ) : null;
};

const OverlayPanel = ({
  open,
  side,
  width,
  panel,
  onClose,
}: DrawerPanelProps & {
  onClose: () => void;
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(width, screenWidth);
  const [shown, setShown] = useState(false);
  const visible = open || shown;
  useWebScrollLock(visible);
  const progress = useDrawerProgress(open, shown, 0, setShown);
  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: (side === 'left' ? -1 : 1) * panelWidth * (1 - progress.value) }],
  }));
  const dismiss = () => {
    if (open) onClose();
  };

  if (!visible) return null;
  return (
    <Modal
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      onRequestClose={dismiss}
      onShow={() => setShown(true)}
    >
      <View style={styles.overlay}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, modalBackdropStyle, backdrop]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessible={false} aria-hidden tabIndex={-1} />
        <Animated.View style={[styles.panel, { width: panelWidth, [side]: 0 }, slide]}>
          <Panel
            accessibilityViewIsModal
            onAccessibilityEscape={dismiss}
            style={{
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            }}
          >
            {panel}
          </Panel>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const SideDrawer = (props: SideDrawerProps) => {
  const { open, side = 'left', width = 260, panel, children } = props;
  const [frameWidth, setFrameWidth] = useState<number>();
  const push = props.mode !== 'overlay';
  const drawer = push ? (
    <PushPanel open={open} side={side} width={Math.min(width, frameWidth ?? width)} panel={panel} />
  ) : null;
  return (
    <>
      {(push || children != null) && (
        <Frame onLayout={(event) => setFrameWidth(event.nativeEvent.layout.width)}>
          {side === 'left' ? drawer : null}
          <Content>{children}</Content>
          {side === 'right' ? drawer : null}
        </Frame>
      )}
      {props.mode === 'overlay' && (
        <OverlayPanel open={open} side={side} width={width} panel={panel} onClose={props.onClose} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, overflow: 'hidden' },
  panel: { position: 'absolute', top: 0, bottom: 0 },
  pushClip: { overflow: 'hidden' },
});
