import type { ComponentProps, ReactNode } from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '@repo/shared/components';

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
  flex: ${({ $fill }) => ($fill ? '1' : '0 0 auto')};
`;

const Header = styled.View`
  z-index: ${theme.zIndex.raised};
  border-bottom-width: ${theme.borderWeight[25]};
  border-bottom-color: ${theme.colors.border.default};
  background-color: ${theme.colors.surface.default};
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
  headerClassName?: string;
  scrollable?: boolean;
};

export const BaseLayout = ({ children, className, header, headerClassName, scrollable = true, ...props }: Props) => {
  const content = (
    <Content $fill={!scrollable} className={className}>
      {children}
    </Content>
  );

  return (
    <Layout>
      {header ? (
        <Header>
          <Content className={headerClassName}>{header}</Content>
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
