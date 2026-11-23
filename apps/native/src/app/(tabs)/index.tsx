// Test page: keep example text here; do not add translations for this file.
import { useRootNavigationState } from 'expo-router';
import { BaseLayout } from '@/components/base-layout';
import { Fragment, useEffect, useState } from 'react';
import {
  Avatar,
  Icon,
  Text,
  Input,
  Textarea,
  SetPasswordInput,
  Loader,
  Checkbox,
  PhoneInput,
  Radio,
  RadioGroup,
  OverflowFade,
  Button,
  Pagination,
  Modal,
  ModalButtons,
  ModalError,
  ModalTitle,
  Select,
  Dropdown,
  EmptyState,
  ListRow,
  SideDrawer,
  Skeleton,
  Switch,
  Tabs,
  baseColors,
  theme,
  useModal,
  useThemeMode,
  type ThemeMode,
} from '@repo/shared/components';
import { toast } from '@repo/shared/toast';
import styled from 'styled-components/native';

const Section = styled.View`
  border: 1px solid grey;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const SectionHeader = styled(Text.H2)`
  margin-bottom: 16px;
  font-weight: 700;
`;
const Row = styled.View`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[300]};
`;
const SwatchGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[100]};
`;
const Swatch = styled.View`
  width: 110px;
  min-height: 80px;
  border: 1px solid ${theme.colors.border.default};
  border-radius: ${theme.radius[200]};
  padding: 8px;
`;

type Palette = { readonly [name: string]: string | Palette };

function colorEntries(palette: Palette, prefix = ''): [string, string][] {
  return Object.entries(palette).flatMap(([name, value]): [string, string][] => {
    const token = `${prefix}${name}`;
    return typeof value === 'string' ? [[token, value]] : colorEntries(value, `${token}.`);
  });
}

function swatchTextColor(hex: string, backdrop: string) {
  const alpha = hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1;
  const [red, green, blue] = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16);
    const behind = parseInt(backdrop.slice(offset, offset + 2), 16);
    const srgb = (channel * alpha + behind * (1 - alpha)) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  // This is where black and white have equal WCAG contrast.
  return luminance < Math.sqrt(0.05 * 1.05) - 0.05 ? baseColors.base.white : baseColors.base.black;
}

function ColorPreview({
  palette,
  backdrop,
  withGroupTitle,
}: {
  palette: Palette;
  backdrop: string;
  withGroupTitle?: boolean;
}) {
  return Object.entries(palette).map(([group, value]) => (
    <Fragment key={group}>
      {withGroupTitle && typeof value !== 'string' && <Text.Label role="heading">{group}</Text.Label>}
      <SwatchGrid>
        {colorEntries({ [group]: value }).map(([token, hex]) => {
          const color = swatchTextColor(hex, backdrop);
          return (
            <Swatch key={token} aria-hidden style={{ backgroundColor: hex }}>
              <Text.Caption color={color}>{token}</Text.Caption>
              <Text.S color={color}>{hex}</Text.S>
            </Swatch>
          );
        })}
      </SwatchGrid>
    </Fragment>
  ));
}

export default function IndexPage() {
  const rootNavigationState = useRootNavigationState();
  const { openModal, closeModal } = useModal();
  const { mode: themeMode, setMode: setThemeMode, colors } = useThemeMode();
  const [name, setName] = useState('');
  const [invalidValue, setInvalidValue] = useState('Invalid value');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [storagePlan, setStoragePlan] = useState('personal');
  const [updatesEnabled, setUpdatesEnabled] = useState(false);
  const [showFullPageLoader, setShowFullPageLoader] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedColors, setSelectedColors] = useState<string[]>(['green']);
  const [lastAction, setLastAction] = useState('');
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const colorOptions = [
    { label: 'Blue', value: 'blue' },
    { label: 'Green', value: 'green' },
    { label: 'Red', value: 'red' },
    ...Array.from({ length: 20 }, (_, index) => ({
      label: `Color ${index + 1}`,
      value: `color-${index + 1}`,
    })),
  ];

  const openExample = (example: 'standard' | 'long' | 'locked') =>
    openModal(
      <Modal accessibilityLabel="Example dialog" closeLabel="Close example" disableClickOutside={example === 'locked'}>
        <ModalTitle>Example dialog</ModalTitle>
        <Text.M>
          {example === 'locked'
            ? 'Backdrop taps are disabled. Close with the button, Escape, or Android Back.'
            : 'Only this content scrolls. The title and buttons stay visible.'}
        </Text.M>
        <Input label="Modal value" placeholder="Check keyboard and focus" />
        <ModalError>Example validation error.</ModalError>
        {example === 'long' &&
          Array.from({ length: 30 }, (_, index) => <Text.M key={index}>Modal row {index + 1}</Text.M>)}
        <ModalButtons>
          <Button variant="secondary" onPress={closeModal}>
            Cancel
          </Button>
          <Button onPress={closeModal}>Done</Button>
          <Button
            onPress={() => {
              setShowFullPageLoader(true);
              closeModal();
            }}
          >
            Close dialog while loading
          </Button>
          {example === 'standard' && (
            <Button
              onPress={() => {
                closeModal();
                openExample('long');
              }}
            >
              Replace while closing
            </Button>
          )}
        </ModalButtons>
      </Modal>
    );

  useEffect(() => {
    if (!showFullPageLoader) return;

    const timer = setTimeout(() => setShowFullPageLoader(false), 3000);
    return () => clearTimeout(timer);
  }, [showFullPageLoader]);

  if (!rootNavigationState?.key) return null;

  return (
    <>
      <SideDrawer
        open={rightDrawerOpen}
        side="right"
        mode="overlay"
        onClose={() => setRightDrawerOpen(false)}
        panel={
          <>
            <Button onPress={() => setRightDrawerOpen(false)}>Close right drawer</Button>
            <Button accessibilityState={{ expanded: leftDrawerOpen }} onPress={() => setLeftDrawerOpen(true)}>
              Open nested left drawer
            </Button>
            <SideDrawer
              open={leftDrawerOpen}
              mode="overlay"
              onClose={() => setLeftDrawerOpen(false)}
              panel={<Button onPress={() => setLeftDrawerOpen(false)}>Close left drawer</Button>}
            />
          </>
        }
      />
      <BaseLayout style={{ backgroundColor: colors.surface.medium }}>
        <Section>
          <SectionHeader>Button</SectionHeader>
          <Row>
            <Button size="small" onPress={() => setUpdatesEnabled((enabled) => !enabled)}>
              Small
            </Button>
            <Button size="medium">Medium</Button>
            <Button size="large">Large</Button>
          </Row>
          <Row>
            <Button variant="primary">Primary</Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </Row>
          <Row>
            <Button variant="secondary">Secondary</Button>
            <Button variant="secondary" loading>
              Loading
            </Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </Row>
          <Row>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="tertiary" loading>
              Loading
            </Button>
            <Button variant="tertiary" disabled>
              Disabled
            </Button>
          </Row>
          <Row>
            <Button variant="destructive">Destructive</Button>
            <Button variant="destructive" loading>
              Loading
            </Button>
            <Button variant="destructive" disabled>
              Disabled
            </Button>
          </Row>
          <Row>
            <Button variant="link" href="#">
              Link
            </Button>
            <Button variant="link" loading>
              Loading
            </Button>
            <Button variant="link" disabled>
              Disabled
            </Button>
          </Row>
        </Section>

        <Section>
          <SectionHeader>Shared text</SectionHeader>
          <Text.DisplayXL>Display XL</Text.DisplayXL>
          <Text.DisplayL>Display L</Text.DisplayL>
          <Text.H1>Heading 1</Text.H1>
          <Text.H2>Heading 2</Text.H2>
          <Text.H3>Heading 3</Text.H3>
          <Text.L>Text L</Text.L>
          <Text.M>Text M</Text.M>
          <Text.S>Text S</Text.S>
          <Text.Button>Button text</Text.Button>
          <Text.Label>Label text</Text.Label>
          <Text.Caption>Caption text</Text.Caption>
          <Text.FormLabel>Form label text</Text.FormLabel>
          <Text.FormPlaceholder>Form placeholder text</Text.FormPlaceholder>
          <Text.FormMessage>Form message text</Text.FormMessage>
          <Text.M em="primary">Primary</Text.M>
          <Text.M em="underline">Underline</Text.M>
          <Text.M em="circle">Circle</Text.M>
          <Text.M em="divider">Divider</Text.M>
        </Section>
        <Section>
          <SectionHeader>Input</SectionHeader>
          <Input
            label="Display name"
            placeholder="Enter a display name"
            info="This is how your name appears to others."
            value={name}
            onChangeText={setName}
            required
          />
          <Input
            label="Invalid input"
            error="This value is invalid."
            value={invalidValue}
            onChangeText={setInvalidValue}
            leftIcon={<Icon.Eye />}
          />
          <Input label="Disabled input" disabled icon={<Icon.Eye />} />
        </Section>
        <Section>
          <SectionHeader>Input variations</SectionHeader>
          <Textarea
            label="Textarea"
            placeholder="Write more than one line"
            info="Try entering multiple lines."
            value={description}
            onChangeText={setDescription}
          />
          <PhoneInput
            label="Phone number"
            value={phone}
            onValueChange={setPhone}
            info="Enter a 10-digit phone number."
          />
          <SetPasswordInput label="Password" defaultValue="Example1" />
        </Section>
        <Section>
          <SectionHeader>Select and dropdown</SectionHeader>
          <Select
            label="Favorite color"
            options={colorOptions}
            value={selectedColor}
            onValueChange={setSelectedColor}
            searchable
            closeLabel="Close colors"
          />
          <Select
            label="Multiple colors"
            options={colorOptions}
            value={selectedColors}
            onValuesChange={setSelectedColors}
            multiple
            searchable
            closeLabel="Close multiple colors"
            removeLabel={(label) => `Remove ${label}`}
          />
          <Select label="Required color" options={colorOptions} error="Please choose a color." required />
          <Select label="Disabled color" options={colorOptions} defaultValue="green" disabled />
          <Select label="Empty colors" options={[]} noOptionsLabel="No colors available" />
          <Dropdown
            label="Color actions"
            closeLabel="Close actions"
            trigger={<Text.M>Custom action trigger</Text.M>}
            items={[
              { label: 'Use blue', icon: <Icon.Eye size={20} />, onClick: () => setLastAction('blue') },
              undefined,
              { label: 'Unavailable action', disabled: true, onClick: () => setLastAction('disabled') },
              { label: 'Use red', color: '#b42318', onClick: () => setLastAction('red') },
            ]}
          />
          <Dropdown
            label="Default actions"
            items={[{ label: 'Reset color', onClick: () => setSelectedColor('blue') }]}
          />
          <Dropdown
            label="Button actions"
            trigger={(props) => (
              <Button {...props} variant="secondary">
                Button trigger
              </Button>
            )}
            items={[{ label: 'Use green', onClick: () => setLastAction('green') }]}
          />
          <Dropdown
            label="Disabled actions"
            disabled
            trigger={<Text.M>Disabled trigger</Text.M>}
            items={[{ label: 'Unavailable', onClick: () => setLastAction('disabled') }]}
          />
          <Text.S>Last action: {lastAction || 'none'}</Text.S>
        </Section>
        <Section>
          <SectionHeader>Checkbox</SectionHeader>
          <Checkbox
            id={'updates-checkbox'}
            label="Email me updates"
            checked={updatesEnabled}
            onValueChange={setUpdatesEnabled}
            info="You can change this preference later."
          />
          <Checkbox label="Agreement" error="Please confirm this choice." />
          <Checkbox label="Disabled checkbox" disabled defaultChecked />
        </Section>
        <Section>
          <SectionHeader>Radio</SectionHeader>
          <RadioGroup name="storage-plan" legend="Storage plan">
            <Text.S>Choose one plan. This description must not become a radio tab stop.</Text.S>
            <Radio checked={storagePlan === 'personal'} onValueChange={() => setStoragePlan('personal')}>
              Personal
            </Radio>
            <Radio checked={storagePlan === 'shared'} onValueChange={() => setStoragePlan('shared')}>
              Shared
            </Radio>
            <Radio disabled>Unavailable</Radio>
          </RadioGroup>
          <Text.S>Selected plan: {storagePlan}</Text.S>
          <RadioGroup name="upload-quality" legend="Upload quality" error="Choose an available quality.">
            <Radio variant="vertical" defaultChecked>
              Original
              <Text.S>Keep full resolution</Text.S>
            </Radio>
            <Radio variant="vertical" disabled>
              Ultra
            </Radio>
            <Radio variant="vertical">Compressed</Radio>
          </RadioGroup>
          <Radio error="This choice is invalid.">Radio with error</Radio>
          <Radio disabled defaultChecked>
            Disabled selected radio
          </Radio>
        </Section>
        <Section>
          <SectionHeader>Loader</SectionHeader>
          <Loader block />
          <Button onPress={() => setShowFullPageLoader(true)}>Show full page loader</Button>
        </Section>
        <Section>
          <SectionHeader>Toast</SectionHeader>
          <Row>
            <Button onPress={() => toast.success('Changes saved')}>Success toast</Button>
            <Button variant="secondary" onPress={() => toast.info('A useful update')}>
              Info toast
            </Button>
            <Button variant="secondary" onPress={() => toast.warning('Check this setting')}>
              Warning toast
            </Button>
            <Button variant="destructive" onPress={() => toast.error('Unable to save')}>
              Error toast
            </Button>
          </Row>
        </Section>
        <Section>
          <SectionHeader>Tabs</SectionHeader>
          <Tabs
            accessibilityLabel="Example sections"
            items={[
              { label: 'Overview', value: 'overview' },
              { label: 'Activity', value: 'activity' },
              { label: 'Archived', value: 'archived', disabled: true },
            ]}
            value={activeTab}
            onValueChange={setActiveTab}
          />
          <Text.S>Active tab: {activeTab}</Text.S>
        </Section>
        <Section>
          <SectionHeader>Switch</SectionHeader>
          <Switch
            label="Enable notifications"
            info="This preference can be changed later."
            checked={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <Switch label="Disabled switch" disabled checked />
          <Switch label="Invalid switch" error="Choose another value." />
        </Section>
        <Section>
          <SectionHeader>Empty state</SectionHeader>
          <EmptyState
            icon={<Icon.Folder size={32} color={colors.text.secondary} aria-hidden />}
            title="No projects yet"
            description="Create the first project to start organizing your files."
            action={<Button variant="secondary">Create project</Button>}
          />
        </Section>
        <Section>
          <SectionHeader>Skeleton</SectionHeader>
          <Row>
            <Skeleton circle width={48} height={48} />
            <Skeleton width="70%" height={20} />
            <Skeleton width="45%" height={12} />
          </Row>
        </Section>
        <Section>
          <SectionHeader>List row</SectionHeader>
          <ListRow
            leading={<Avatar alt="Ada Lovelace" />}
            title="Ada Lovelace"
            description="ada@example.com"
            trailing={<Icon.ChevronRight size={18} color={colors.text.secondary} aria-hidden />}
            onPress={() => setLastAction('list row')}
          />
          <ListRow
            title="Selected row"
            description="Use selected for active list items."
            selected
            trailing={<Icon.Check size={18} color={colors.text.brand} aria-hidden />}
          />
        </Section>
        <Section>
          <SectionHeader>Pagination</SectionHeader>
          <Pagination perPage={10} totalCount={80} currentPage={currentPage} paginate={setCurrentPage} />
          <Pagination
            perPage={10}
            totalCount={80}
            currentPage={currentPage}
            paginate={setCurrentPage}
            variant="simple"
            jumper
          />
        </Section>
        <Section>
          <SectionHeader>Modal</SectionHeader>
          <Row>
            <Button onPress={() => openExample('standard')}>Open modal</Button>
            <Button onPress={() => openExample('long')}>Open long modal</Button>
            <Button onPress={() => openExample('locked')}>Open modal no backdrop</Button>
          </Row>
        </Section>
        <Section>
          <SectionHeader>Overflow fade</SectionHeader>
          <OverflowFade maxHeight={140}>
            {Array.from({ length: 8 }, (_, index) => (
              <Text.M key={index}>Scrollable item {index + 1}</Text.M>
            ))}
          </OverflowFade>
        </Section>
        <Section>
          <SectionHeader>Side drawers</SectionHeader>
          <Button accessibilityState={{ expanded: rightDrawerOpen }} onPress={() => setRightDrawerOpen(true)}>
            Open full-screen right overlay
          </Button>
        </Section>

        <Section>
          <SectionHeader>Avatar</SectionHeader>
          <Avatar size="sm" alt="Space Silo" />
          <Avatar alt="Project Atlas" color="#ef8354" />
          <Avatar size="lg" alt="Space Silo" color="#1f8a70" />
        </Section>
        <Section>
          <SectionHeader>Base colors</SectionHeader>
          <ColorPreview palette={baseColors} backdrop={colors.surface.medium} />
        </Section>
        <Section>
          <SectionHeader>Semantic colors</SectionHeader>
          <Select
            label="Theme"
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'Follow device', value: 'system' },
            ]}
            value={themeMode}
            onValueChange={(value) => setThemeMode(value as ThemeMode)}
          />
          <ColorPreview palette={colors} backdrop={colors.surface.medium} withGroupTitle />
        </Section>
      </BaseLayout>
      {showFullPageLoader && <Loader fullPage onRequestClose={() => setShowFullPageLoader(false)} />}
    </>
  );
}
