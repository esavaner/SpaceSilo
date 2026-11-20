// Test page: keep example text here; do not add translations for this file.
import { useRootNavigationState } from 'expo-router';
import { BaseLayout } from '@/components/base-layout';
import { useEffect, useState } from 'react';
import {
  Avatar,
  Icon,
  Text,
  Input,
  Textarea,
  SetPasswordInput,
  PasswordInput,
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
  SideDrawer,
  useModal,
  useThemeMode,
  type ThemeMode,
} from '@repo/shared/components';
import styled from 'styled-components/native';

const Section = styled.View`
  margin-bottom: 16px;
  border: 1px solid grey;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const SectionHeader = styled.Text`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

export default function IndexPage() {
  const rootNavigationState = useRootNavigationState();
  const { openModal, closeModal } = useModal();
  const { mode: themeMode, setMode: setThemeMode, colors } = useThemeMode();
  const [name, setName] = useState('');
  const [invalidValue, setInvalidValue] = useState('Invalid value');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storagePlan, setStoragePlan] = useState('personal');
  const [updatesEnabled, setUpdatesEnabled] = useState(false);
  const [explicitCheckboxId, setExplicitCheckboxId] = useState(false);
  const [showFullPageLoader, setShowFullPageLoader] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedColors, setSelectedColors] = useState<string[]>(['green']);
  const [lastAction, setLastAction] = useState('');
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
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
          <SectionHeader>Side drawers</SectionHeader>
          <Button accessibilityState={{ expanded: rightDrawerOpen }} onPress={() => setRightDrawerOpen(true)}>
            Open full-screen right overlay
          </Button>
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
          <Text.S>Selected color: {selectedColor}</Text.S>
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
          <Text.S>Selected colors: {selectedColors.join(', ')}</Text.S>
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
          <SectionHeader>Avatar</SectionHeader>
          <Avatar size="sm" alt="Space Silo" />
          <Avatar alt="Project Atlas" color="#ef8354" />
          <Avatar size="lg" alt="Space Silo" color="#1f8a70" />
        </Section>

        <Section>
          <SectionHeader>Shared text</SectionHeader>
          <Text.S center italic weight={700} color="#307467">
            Centered, italic, bold, and colored.
          </Text.S>
          <Text.M em="primary">Primary emphasis</Text.M>
          <Text.M em="underline">Underline emphasis</Text.M>
          <Text.M em="circle">Circle emphasis</Text.M>
          <Text.M em="divider">Divider emphasis</Text.M>
        </Section>

        <Section>
          <SectionHeader>Loader</SectionHeader>
          <Loader />
          <Loader block />
          <Button onPress={() => setShowFullPageLoader(true)}>Show full page loader</Button>
        </Section>

        <Section>
          <SectionHeader>Button</SectionHeader>
          <Button onPress={() => setUpdatesEnabled((enabled) => !enabled)}>Primary</Button>
          <Button variant="secondary" onPress={() => setUpdatesEnabled((enabled) => !enabled)}>
            Secondary
          </Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link" href="#">
            Link
          </Button>
          <Button size="small">Small</Button>
          <Button size="large">Large</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button center>Centered button</Button>
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
          <Button onPress={() => openExample('standard')}>Open modal</Button>
          <Button onPress={() => openExample('long')}>Open long modal</Button>
          <Button onPress={() => openExample('locked')}>Open modal with backdrop dismissal disabled</Button>
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
          <SectionHeader>Checkbox</SectionHeader>
          <Checkbox
            id={explicitCheckboxId ? 'updates-checkbox' : undefined}
            label="Email me updates"
            checked={updatesEnabled}
            onValueChange={setUpdatesEnabled}
            info="You can change this preference later."
          />
          <Checkbox label="Agreement" error="Please confirm this choice." />
          <Checkbox label="Disabled checkbox" disabled defaultChecked />
          <Button onPress={() => setExplicitCheckboxId((explicit) => !explicit)}>Toggle checkbox ID</Button>
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
          <SectionHeader>Phone input</SectionHeader>
          <PhoneInput
            label="Phone number"
            value={phone}
            onValueChange={setPhone}
            info="Enter a 10-digit phone number."
          />
          <PhoneInput
            label="Phone number with error"
            defaultValue="1234567890"
            error="Please enter a valid phone number."
          />
          <PhoneInput label="Disabled phone number" defaultValue="1234567890" disabled />
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
          <SectionHeader>Textarea</SectionHeader>
          <Textarea
            label="Description"
            placeholder="Write more than one line"
            info="Try entering multiple lines."
            value={description}
            onChangeText={setDescription}
          />
          <Textarea label="Textarea with error" defaultValue="Example text" error="This text is invalid." />
          <Textarea label="Disabled textarea" defaultValue="Cannot edit this text" disabled />
        </Section>

        <Section>
          <SectionHeader>Set password</SectionHeader>
          <PasswordInput label="Current password" />
          <SetPasswordInput label="New password" value={password} onChangeText={setPassword} />
          <SetPasswordInput label="Uncontrolled password" defaultValue="Example1" error="Example error." />
          <SetPasswordInput label="Disabled password" disabled />
        </Section>
      </BaseLayout>
      {showFullPageLoader && <Loader fullPage onRequestClose={() => setShowFullPageLoader(false)} />}
    </>
  );
}
