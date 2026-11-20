import { useContext, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { Button, Icon, theme, useThemeColors } from '@repo/shared/components';
import { NavigationToggleContext } from '@/components/navigation';

const Layout = styled.View`
  position: relative;
  flex: 1;
  background-color: ${theme.colors.surface.default};
`;

const Content = styled.View<{ $fill?: boolean }>`
  align-self: center;
  max-width: 1280px;
  width: 100%;
  padding: ${theme.spacing[400]};
  gap: ${theme.spacing[400]};
  flex: ${({ $fill }) => ($fill ? '1' : '0 0 auto')};
`;

const Header = styled.View`
  z-index: ${theme.zIndex.raised};
  border-bottom-width: ${theme.borderWeight[25]};
  border-bottom-color: ${theme.colors.border.default};
  background-color: ${theme.colors.surface.default};
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: ${theme.spacing[300]};
`;

const HeaderContent = styled.View`
  flex: 1;
  min-width: 0;
  gap: ${theme.spacing[400]};
`;

export const BaseLayoutHeadingRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[300]};
`;

export const BaseLayoutHeading = styled.View`
  flex: 1;
  min-width: 120px;
  gap: ${theme.spacing[100]};
`;

const Scroller = styled.ScrollView`
  position: relative;
  flex: 1;
  background-color: ${theme.colors.surface.default};
`;

const Body = styled.View`
  flex: 1;
  z-index: ${theme.zIndex.base};
`;

type Props = ComponentProps<typeof ScrollView> & {
  children?: ReactNode;
  header?: ReactNode;
  scrollable?: boolean;
};

export const BaseLayout = ({ children, header, scrollable = true, ...props }: Props) => {
  const navigation = useContext(NavigationToggleContext);
  const { t } = useTranslation();
  const colors = useThemeColors();
  const content = <Content $fill={!scrollable}>{children}</Content>;

  return (
    <Layout>
      {header || navigation ? (
        <Header>
          <Content>
            <HeaderRow>
              {navigation ? (
                <Button
                  variant="tertiary"
                  size="small"
                  accessibilityLabel={t('navigation.toggle')}
                  accessibilityState={{ expanded: navigation.open }}
                  onPress={navigation.toggle}
                >
                  <Icon.Menu color={colors.text.default} aria-hidden />
                </Button>
              ) : null}
              {header ? <HeaderContent>{header}</HeaderContent> : null}
            </HeaderRow>
          </Content>
        </Header>
      ) : null}

      {/* RN Modal touches bubble through React ancestors; "never" would eat the first tap while typing in one. */}
      {scrollable ? (
        <Scroller keyboardShouldPersistTaps="handled" {...props}>
          {content}
        </Scroller>
      ) : (
        <Body>{content}</Body>
      )}
    </Layout>
  );
};
