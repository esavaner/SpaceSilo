import { IncludedGroupsDropdown, type IncludedGroupOption } from '@/components/dropdowns/IncludedGroups.dropdown';
import { useFilesContext } from '@/providers/FilesProvider';
import { useServerContext } from '@/providers/ServerProvider';
import { useTranslation } from 'react-i18next';

type Props = {
  className?: string;
};

export const FileFilterDropdown = ({ className }: Props) => {
  const { t } = useTranslation();
  const { servers } = useServerContext();
  const { groups, handleToggleIncludedGroup, isGroupIncluded } = useFilesContext();
  const serverLabels = new Map(servers.map((server) => [server.id, server.label]));
  const options: IncludedGroupOption[] = groups.map((group) => ({
    key: `${group.serverId}:${group.id}`,
    label: group.name,
    serverId: group.serverId,
    serverLabel: serverLabels.get(group.serverId) ?? t('common.messages.connectedServer'),
  }));
  const includedKeys = groups.filter((group) => isGroupIncluded(group)).map((group) => `${group.serverId}:${group.id}`);

  return (
    <IncludedGroupsDropdown
      options={options}
      includedKeys={includedKeys}
      title={t('files.filter.title')}
      includeLabel={t('files.filter.included')}
      emptyLabel={t('files.filter.empty')}
      onToggleIncluded={(key) => {
        const group = groups.find((item) => `${item.serverId}:${item.id}` === key);

        if (group) {
          handleToggleIncludedGroup(group);
        }
      }}
      buttonClassName={className}
      buttonVariant="ghost"
    />
  );
};
