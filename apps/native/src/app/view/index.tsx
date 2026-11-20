import { useLocalSearchParams } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import { Image } from 'expo-image';
import { Text, theme } from '@repo/shared/components';
import { FileType, getFileType } from '@/utils/files';

const Page = styled.View`
  position: relative;
  flex: 1;
  background-color: ${theme.colors.surface.default};
`;

const Stage = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.surface.medium};
`;

const PreviewImage = styled(Image)<{ $width: number; $maxHeight: number }>`
  flex: 1;
  width: ${({ $width }) => `${$width}px`};
  max-height: ${({ $maxHeight }) => `${$maxHeight}px`};
`;

const DocumentScroll = styled.ScrollView`
  flex: 1;
  width: 100%;
`;

const DocumentScrollContent = styled.View`
  flex-grow: 1;
  align-items: center;
  padding: ${theme.spacing[400]};
`;

const Document = styled.View<{ $minHeight: number }>`
  width: 100%;
  max-width: 512px;
  min-height: ${({ $minHeight }) => `${$minHeight}px`};
  padding: ${theme.spacing[400]};
  border-radius: ${theme.radius[200]};
  background-color: ${theme.colors.surface.default};
`;

export default function ViewPage() {
  const { groupId, fileUri } = useLocalSearchParams<{ groupId: string; fileUri: string }>();
  const { width, height } = useWindowDimensions();

  // const { data: file } = useQuery({
  //   queryKey: ['file', groupId, fileUri],
  //   queryFn: async () => {
  //     if (!fileUri || !groupId) return;
  //     const r = await Api.files.filesControllerFind({ fileUri, groupId });
  //     return r.data;
  //   },
  // });

  // const fileType = getFileType(file?.type);

  // const { data: fileData } = useQuery({
  //   queryKey: ['download', groupId, fileUri],
  //   queryFn: async () => {
  //     if (!fileUri) return;
  //     const r = await Api.files.filesControllerDownload({ fileUri, groupId });
  //     const s = await r.text();
  //     return s;
  //     // if (!fileUri) return;
  //     // const r = await Api.files.filesControllerDownload({ fileUri });
  //     // const arrayBuffer = await r.arrayBuffer();
  //     // const base64String = Buffer.from(arrayBuffer).toString('base64');
  //     // return `data:image/jpeg;base64,${base64String}`;
  //   },
  //   enabled: fileType !== FileType.IMAGE,
  // });

  const fileType = getFileType('application/pdf'); // TODO: replace with actual file type
  const fileData =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'; // TODO: replace with actual file data

  return (
    <Page>
      <Stage>
        {fileType === FileType.IMAGE ? (
          <PreviewImage
            source={`http://192.168.0.176:3100/files/download?groupId=${groupId}&fileUri=${fileUri}`}
            $width={width * 0.8}
            $maxHeight={height * 0.9}
            contentFit="contain"
          />
        ) : (
          <DocumentScroll>
            <DocumentScrollContent>
              <Document $minHeight={height * 0.8}>
                <Text>{fileData}</Text>
              </Document>
            </DocumentScrollContent>
          </DocumentScroll>
        )}
      </Stage>
    </Page>
  );
}
