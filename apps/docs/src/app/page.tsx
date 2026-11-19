'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  Button,
  Checkbox,
  Dropdown,
  GlobalStyle,
  Input,
  Loader,
  Modal,
  ModalButtons,
  ModalProvider,
  ModalTitle,
  OverflowFade,
  Pagination,
  PasswordInput,
  PhoneInput,
  Radio,
  RadioGroup,
  Select,
  SetPasswordInput,
  Text,
  Textarea,
  theme,
  useModal,
  usePagination,
} from '@repo/shared/components';

const options = ['Photos', 'Videos', 'Documents', 'Music', 'Archives'].map((label) => ({ label, value: label }));
const rows = Array.from({ length: 95 }, (_, i) => i);
const subscribeNoop = () => () => {};

const DemoModal = () => {
  const { closeModal } = useModal();
  return (
    <Modal>
      <ModalTitle>Modal title</ModalTitle>
      <Text.M>Modal content from the shared package.</Text.M>
      <ModalButtons>
        <Button variant="secondary" onClick={closeModal}>
          Cancel
        </Button>
        <Button onClick={closeModal}>Confirm</Button>
      </ModalButtons>
    </Modal>
  );
};

const Showcase = () => {
  const { openModal } = useModal();
  const [radio, setRadio] = useState('a');
  const [password, setPassword] = useState('');
  const [fullPageLoader, setFullPageLoader] = useState(false);
  const { currentPage, paginate, totalCount, itemsPerPage } = usePagination(rows);

  const showFullPageLoader = () => {
    setFullPageLoader(true);
    setTimeout(() => setFullPageLoader(false), 2000);
  };

  return (
    <main style={{ display: 'grid', gap: 24, width: '100%', maxWidth: 720, margin: '0 auto', padding: 32 }}>
      <Text.H1>
        Shared <Text em="underline">components</Text>
      </Text.H1>
      <Text.H3>
        Text <Text em="primary">em</Text> <Text em="circle">variants</Text>
      </Text.H3>
      <Text.M em="divider">divider</Text.M>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link" href="#">
          Link
        </Button>
        <Button size="small">Small</Button>
        <Button size="large">Large</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button onClick={() => openModal(<DemoModal />)}>Open modal</Button>
        <Button variant="secondary" onClick={showFullPageLoader}>
          Full page loader
        </Button>
        <Dropdown
          items={[
            { label: 'Edit', onClick: () => {} },
            { label: 'Delete', onClick: () => {}, color: theme.colors.text.danger },
          ]}
        />
      </div>

      <Input label="Input" info="Helper info" />
      <Input label="Input with error" error="Something went wrong" required />
      <Input label="Disabled input" disabled />
      <PasswordInput label="Password" />
      <SetPasswordInput label="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <PhoneInput label="Phone" />
      <Textarea label="Textarea" />
      <Select label="Select" placeholder="Pick one" options={options} />
      <Select label="Searchable select" options={options} searchable />
      <Select label="Multi select" options={options} multiple searchable />
      <Checkbox label="Checkbox" />
      <Checkbox label="Checkbox with error" error="Required" />
      <RadioGroup name="radio" legend="Radio group">
        <Radio value="a" checked={radio === 'a'} onChange={() => setRadio('a')}>
          Option A
        </Radio>
        <Radio value="b" checked={radio === 'b'} onChange={() => setRadio('b')} variant="vertical">
          Option B
        </Radio>
        <Radio value="c" disabled>
          Disabled
        </Radio>
      </RadioGroup>

      <OverflowFade maxHeight={160}>
        {rows.slice(0, 20).map((row) => (
          <Text.M key={row}>Scrollable row {row + 1}</Text.M>
        ))}
      </OverflowFade>

      <Pagination perPage={itemsPerPage} totalCount={totalCount} currentPage={currentPage} paginate={paginate} />
      <Pagination
        perPage={itemsPerPage}
        totalCount={totalCount}
        currentPage={currentPage}
        paginate={paginate}
        variant="simple"
        jumper
      />

      <Loader block />
      {fullPageLoader && <Loader fullPage />}
    </main>
  );
};

export default function Home() {
  // shortcut: client-only because sc v7 prerelease nests styled elements differently on server vs client, shifting useId (hydration mismatch); drop once sc SSR output matches
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
  if (!mounted) return null;

  return (
    <ModalProvider>
      <GlobalStyle />
      <Showcase />
    </ModalProvider>
  );
}
