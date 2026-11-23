import { useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import styled from 'styled-components/native';
import { Avatar, EmptyState, Icon, Text, theme, useThemeColors } from '@repo/shared/components';
import { GroupOptionsDropdown } from './dropdowns/GroupOptions.dropdown';
import { type GroupListItem } from '@/hooks/useGroupList';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

type Props = {
  groups?: GroupListItem[];
  emptyText?: string;
  scrollable?: boolean;
  viewerIds?: string[];
};

const Grid = styled.View`
  width: 100%;
  flex-direction: row;
  flex-wrap: wrap;
`;

const CardSlot = styled.View<{ $columns: number; $menuOpen: boolean }>`
  width: ${({ $columns }) => `${100 / $columns}%`};
  padding: ${theme.spacing[150]};
  z-index: ${({ $menuOpen }) => ($menuOpen ? theme.zIndex.raised : theme.zIndex.base)};
`;

const Card = styled.Pressable<{ $owned: boolean }>`
  height: 100%;
  gap: ${theme.spacing[400]};
  padding: ${theme.spacing[400]};
  padding-right: 56px;
  border: ${theme.borderWeight[25]} solid
    ${({ $owned }) => ($owned ? theme.colors.border.primary.default : theme.colors.border.default)};
  border-radius: ${theme.radius[300]};
  background-color: ${({ $owned }) => ($owned ? theme.colors.surface.stronger : theme.colors.surface.medium)};
  cursor: pointer;
  &:hover,
  &:focus-visible {
    background-color: ${theme.colors.surface.stronger};
  }
`;

const Options = styled.View`
  position: absolute;
  top: ${theme.spacing[300]};
  right: ${theme.spacing[300]};
  z-index: ${theme.zIndex.raised};
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[200]};
`;

const CardHeading = styled.View`
  flex: 1;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[200]};
`;

const Badges = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[200]};
`;

const Badge = styled.View<{ $accent?: boolean }>`
  padding: ${theme.spacing[100]} ${theme.spacing[200]};
  border: ${theme.borderWeight[25]} solid
    ${({ $accent }) => ($accent ? theme.colors.border.primary.default : theme.colors.border.default)};
  border-radius: ${theme.radius.full};
  background-color: ${({ $accent }) => ($accent ? theme.colors.surface.stronger : theme.colors.surface.weak)};
`;

const CardFooter = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ColorSwatch = styled.View<{ $color?: string }>`
  width: 12px;
  height: 12px;
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius.full};
  background-color: ${({ $color }) => $color ?? 'transparent'};
`;

const GroupBadge = ({ label, accent = false }: { label: string; accent?: boolean }) => (
  <Badge $accent={accent}>
    <Text.Caption color={accent ? theme.colors.text.brand : theme.colors.text.secondary}>{label}</Text.Caption>
  </Badge>
);

export const GroupList = ({ groups, emptyText, scrollable = true, viewerIds = [] }: Props) => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const columns = width >= 1280 ? 3 : width >= theme.breakpointNumbers.sm ? 2 : 1;

  const formatCount = (value: number, label: 'member' | 'album' | 'photo') => {
    const nounKey = { album: 'albums', member: 'members', photo: 'photos' }[label];
    return `${value} ${t(`common.nouns.${nounKey}`)}`;
  };

  const content =
    groups && groups.length > 0 ? (
      <Grid>
        {groups.map((group) => {
          const isOwnedByViewer = viewerIds.includes(group.ownerId);
          const key = `${group.serverId}:${group.id}`;

          return (
            <CardSlot key={key} $columns={columns} $menuOpen={openMenu === key}>
              <Options>
                <GroupOptionsDropdown
                  group={group}
                  canManage={isOwnedByViewer}
                  onOpenChange={(open) => setOpenMenu(open ? key : null)}
                />
              </Options>
              <Link
                href={{ pathname: '/group/[groupId]', params: { groupId: group.id, serverId: group.serverId } }}
                asChild
              >
                <Card $owned={isOwnedByViewer}>
                  <Row>
                    <Avatar alt={group.name} color={group.color ?? undefined} />
                    <CardHeading>
                      <Text.L style={{ flexShrink: 1 }}>{group.name}</Text.L>
                      {isOwnedByViewer && <GroupBadge label={t('groups.badges.owned')} accent />}
                    </CardHeading>
                  </Row>
                  <Badges>
                    <GroupBadge label={formatCount(group.members?.length ?? 0, 'member')} />
                    <GroupBadge label={formatCount(group.albumIds?.length ?? 0, 'album')} />
                    <GroupBadge label={formatCount(group.photoIds?.length ?? 0, 'photo')} />
                  </Badges>
                  <CardFooter>
                    <ColorSwatch $color={group.color ?? undefined} />
                    <Row>
                      <Text.Caption color={theme.colors.text.secondary}>#{group.id.slice(0, 8)}</Text.Caption>
                      <Icon.ChevronRight size={16} color={colors.text.secondary} aria-hidden />
                    </Row>
                  </CardFooter>
                </Card>
              </Link>
            </CardSlot>
          );
        })}
      </Grid>
    ) : (
      <EmptyState
        description={
          <Text center color={theme.colors.text.secondary}>
            {emptyText ?? t('groups.emptyFiltered')}
          </Text>
        }
        style={{ width: '100%' }}
      />
    );

  return scrollable ? <ListScroller>{content}</ListScroller> : content;
};

const ListScroller = styled.ScrollView`
  flex: 1;
  width: 100%;
`;
