import { Avatar } from '@/components/avatar';
import { BaseLayout } from '@/components/base-layout';
import { Breadcrumb } from '@/components/breadcrumb';
import { GroupFilterDropdown, type GroupFilter } from '@/components/dropdowns/GroupFilter.dropdown';
import { Input } from '@/components/form/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/form/select';
import { Button } from '@/components/general/button';
import { Text } from '@/components/general/text';
import { Search } from '@/components/search';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

const componentCatalog = [
  { name: 'Text', kind: 'Primitive', note: 'Typography scale and readable content blocks.' },
  { name: 'Button', kind: 'Primitive', note: 'Primary actions, subtle actions, and destructive intent.' },
  { name: 'Input', kind: 'Primitive', note: 'Single-line form entry with shared styling.' },
  { name: 'Select', kind: 'Primitive', note: 'Structured choices with native and web support.' },
  { name: 'Avatar', kind: 'Composite', note: 'Identity badge with initials or image fallback.' },
  { name: 'Breadcrumb', kind: 'Composite', note: 'Path navigation built from button primitives.' },
  { name: 'Search', kind: 'Composite', note: 'Input paired with a lightweight result panel.' },
  { name: 'GroupFilterDropdown', kind: 'Composite', note: 'Menu-based filtering built on dropdown primitives.' },
] as const;

const toneOptions = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'expressive', label: 'Expressive' },
] as const;

function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-2xl border border-border bg-layer-secondary/40 p-4 ${className}`}>{children}</View>;
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text variant="h3">{title}</Text>
        <Text className="text-muted-foreground">{description}</Text>
      </View>
      {children}
    </View>
  );
}

export default function RnpPage() {
  const [buttonCount, setButtonCount] = useState(0);
  const [inputValue, setInputValue] = useState('Shared building blocks make screens move faster.');
  const [searchValue, setSearchValue] = useState('');
  const [tone, setTone] = useState<(typeof toneOptions)[number]['value']>('balanced');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');

  const filteredCatalog = componentCatalog.filter((component) => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [component.name, component.kind, component.note].some((value) => value.toLowerCase().includes(query));
  });

  const searchOptions =
    searchValue.trim().length > 0
      ? filteredCatalog.map((component) => (
          <View key={component.name} className="border-b border-border px-3 py-2 last:border-b-0">
            <Text className="font-medium">{component.name}</Text>
            <Text className="text-xs text-muted-foreground">
              {component.kind} · {component.note}
            </Text>
          </View>
        ))
      : [];

  return (
    <BaseLayout>
      <View className="gap-8 pb-10">
        <View className="gap-3">
          <Text variant="h1">Native Component Playground</Text>
          <Text className="max-w-3xl text-muted-foreground">
            This page lines up project components from the most reusable primitives to more composed pieces so you can
            inspect the design language in one place.
          </Text>
        </View>

        <Section
          title="1. Text"
          description="Start with typography, since it is the base layer every other component builds on."
        >
          <Surface className="gap-3">
            <Text variant="h2">Heading scale</Text>
            <Text variant="lead">Lead copy gives larger sections a clear opening sentence.</Text>
            <Text>
              Body text stays neutral and readable, while <Text variant="code">code</Text> style can call out short
              implementation details inline.
            </Text>
            <Text variant="small">Small text works for metadata, helper labels, and subdued UI details.</Text>
          </Surface>
        </Section>

        <Section
          title="2. Buttons"
          description="Action styles come next: one primary, then supporting variants with lighter or riskier intent."
        >
          <Surface className="gap-4">
            <View className="flex-row flex-wrap gap-3">
              <Button onPress={() => setButtonCount((count) => count + 1)}>Primary action</Button>
              <Button variant="secondary" onPress={() => setButtonCount(0)}>
                Reset count
              </Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link style</Button>
            </View>
            <Text className="text-muted-foreground">Primary button pressed {buttonCount} times.</Text>
          </Surface>
        </Section>

        <Section
          title="3. Inputs"
          description="Form primitives are the next layer: free text, bounded choices, and menu-driven filtering."
        >
          <View className="gap-4 lg:flex-row lg:items-start">
            <Surface className="flex-1 gap-3">
              <Text variant="large">Input</Text>
              <Input value={inputValue} onChangeText={setInputValue} placeholder="Type something" />
              <Text className="text-sm text-muted-foreground">Live value: {inputValue}</Text>
            </Surface>

            <Surface className="flex-1 gap-3">
              <Text variant="large">Select</Text>
              <Select
                value={toneOptions.find((option) => option.value === tone)}
                onValueChange={(option) =>
                  setTone((option?.value ?? 'balanced') as (typeof toneOptions)[number]['value'])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Visual tone</SelectLabel>
                    {toneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} label={option.label} />
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Text className="text-sm text-muted-foreground">Current selection: {tone}</Text>
            </Surface>

            <Surface className="flex-1 gap-3">
              <Text variant="large">Dropdown component</Text>
              <GroupFilterDropdown value={groupFilter} onChange={setGroupFilter} />
              <Text className="text-sm text-muted-foreground">Active filter: {groupFilter}</Text>
            </Surface>
          </View>
        </Section>

        <Section
          title="4. Identity And Wayfinding"
          description="Once the primitives are in place, simple composites can combine them into recognizable UI patterns."
        >
          <View className="gap-4 lg:flex-row lg:items-start">
            <Surface className="flex-1 gap-4">
              <Text variant="large">Avatar</Text>
              <View className="flex-row flex-wrap items-center gap-4">
                <Avatar alt="Space Silo" color="#1f8a70" size="lg" />
                <Avatar alt="Project Atlas" color="#ef8354" />
                <Avatar alt="FL" size="sm" />
              </View>
            </Surface>

            <Surface className="flex-1 gap-4">
              <Text variant="large">Breadcrumb</Text>
              <Breadcrumb
                items={[
                  { key: 'home', label: 'Workspace', onPress: () => {} },
                  { key: 'native', label: 'Native', onPress: () => {} },
                  { key: 'playground', label: 'Playground' },
                ]}
              />
              <Text className="text-sm text-muted-foreground">
                Breadcrumbs reuse buttons, text, and icons to make path context lightweight.
              </Text>
            </Surface>
          </View>
        </Section>

        <Section
          title="5. Search"
          description="A more composed widget can layer primitives into interaction, state, and contextual results."
        >
          <Surface className="gap-3">
            <Search
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Filter showcased components"
              options={searchOptions}
            />
            <Text className="text-sm text-muted-foreground">
              {searchValue.trim().length > 0
                ? `${filteredCatalog.length} matching component${filteredCatalog.length === 1 ? '' : 's'}`
                : 'Type to open the result panel.'}
            </Text>
          </Surface>
        </Section>
      </View>
    </BaseLayout>
  );
}
