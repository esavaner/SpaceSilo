import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewProps } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../config/theme';
import { Button as ButtonBase } from './button';
import { Input } from './input';
import { ArrowLeft, ArrowRight } from '../assets/icons';
import { Text } from './text';

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[200]};
`;
const Button = styled(ButtonBase)`
  padding: ${theme.spacing[100]} ${theme.spacing[200]};
  min-width: 38px;
  min-height: 40px;
`;
const ArrowButton = styled(Button)`
  background: transparent;
`;
const StaticPage = styled.View`
  padding: ${theme.spacing[100]} ${theme.spacing[200]};
  min-width: 38px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
`;
const PageJumpInput = ({
  totalPages,
  defaultPage,
  onJump,
}: {
  totalPages: number;
  defaultPage?: number;
  onJump: (page: number) => void;
}) => {
  const [value, setValue] = useState(defaultPage ? String(defaultPage) : '');
  const updatedRef = useRef(false);

  const jump = () => {
    if (updatedRef.current) {
      return;
    }
    const page = parseInt(value, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      updatedRef.current = true;
      onJump(page - 1);
    }
  };

  return (
    <Input
      hideLabel
      label="Jump to page"
      inputMode="numeric"
      value={value}
      style={{ textAlign: 'center', width: 64 }}
      onBlur={jump}
      onChangeText={(text) => {
        updatedRef.current = false;
        setValue(text.replace(/\D/g, ''));
      }}
      onSubmitEditing={jump}
    />
  );
};

type Props = ViewProps & {
  className?: string;
  perPage: number;
  currentPage: number;
  totalCount: number;
  paginate: (page: number) => void;
  variant?: 'default' | 'simple';
  jumper?: boolean;
};

export const Pagination = ({
  perPage,
  totalCount,
  currentPage,
  paginate,
  variant = 'default',
  jumper,
  ...rest
}: Props) => {
  if (totalCount <= perPage) {
    return null;
  }

  const totalPages = Math.ceil(totalCount / perPage);
  const prevDisabled = currentPage <= 0;
  const nextDisabled = currentPage >= totalPages - 1;
  const prevIconColor = prevDisabled ? theme.colors.text.disabled : theme.colors.text.brand;
  const nextIconColor = nextDisabled ? theme.colors.text.disabled : theme.colors.text.brand;

  if (variant === 'simple') {
    return (
      <Container {...rest}>
        <ArrowButton
          variant="tertiary"
          disabled={prevDisabled}
          accessibilityLabel="Previous page"
          onPress={() => paginate(currentPage - 1)}
        >
          <ArrowLeft color={prevIconColor} aria-hidden />
        </ArrowButton>
        {jumper ? (
          <PageJumpInput key={currentPage} totalPages={totalPages} defaultPage={currentPage + 1} onJump={paginate} />
        ) : (
          <Button aria-current="page">{currentPage + 1}</Button>
        )}
        <Text.M>/</Text.M>
        <StaticPage>
          <Text.Button color={theme.colors.text.brand}>{totalPages}</Text.Button>
        </StaticPage>
        <ArrowButton
          variant="tertiary"
          disabled={nextDisabled}
          accessibilityLabel="Next page"
          onPress={() => paginate(currentPage + 1)}
        >
          <ArrowRight color={nextIconColor} aria-hidden />
        </ArrowButton>
      </Container>
    );
  }

  const leftDistance = currentPage;
  const rightDistance = totalPages - currentPage - 1;

  return (
    <Container {...rest}>
      <ArrowButton variant="tertiary" disabled={prevDisabled} onPress={() => paginate(currentPage - 1)}>
        <ArrowLeft color={prevIconColor} aria-hidden /> Previous
      </ArrowButton>
      {leftDistance >= 4 && (
        <>
          <Button onPress={() => paginate(0)} variant="tertiary">
            1
          </Button>
          <StaticPage accessible={false} aria-hidden>
            <Text.Button color={theme.colors.text.brand}>...</Text.Button>
          </StaticPage>
          <Button onPress={() => paginate(currentPage - 1)} variant="tertiary">
            {currentPage}
          </Button>
        </>
      )}
      {leftDistance > 0 &&
        leftDistance < 4 &&
        Array.from({ length: leftDistance }, (_, page) => (
          <Button key={page} onPress={() => paginate(page)} variant="tertiary">
            {page + 1}
          </Button>
        ))}
      <Button aria-current="page">{currentPage + 1}</Button>
      {rightDistance > 0 &&
        rightDistance < 4 &&
        Array.from({ length: rightDistance }, (_, index) => {
          const page = currentPage + 1 + index;
          return (
            <Button key={page} onPress={() => paginate(page)} variant="tertiary">
              {page + 1}
            </Button>
          );
        })}
      {rightDistance >= 4 && (
        <>
          <Button onPress={() => paginate(currentPage + 1)} variant="tertiary">
            {currentPage + 2}
          </Button>
          <StaticPage accessible={false} aria-hidden>
            <Text.Button color={theme.colors.text.brand}>...</Text.Button>
          </StaticPage>
          <Button onPress={() => paginate(totalPages - 1)} variant="tertiary">
            {totalPages}
          </Button>
        </>
      )}
      <ArrowButton variant="tertiary" disabled={nextDisabled} onPress={() => paginate(currentPage + 1)}>
        Next <ArrowRight color={nextIconColor} aria-hidden />
      </ArrowButton>
      {jumper && (
        <>
          <Text.M>Go to</Text.M>
          <PageJumpInput key={currentPage} totalPages={totalPages} defaultPage={currentPage + 1} onJump={paginate} />
          <Text.M>page</Text.M>
        </>
      )}
    </Container>
  );
};

export const usePagination = <T,>(data: T[] = [], itemsPerPage = 10) => {
  const [unsafeCurrent, setCurrent] = useState(0);
  const totalCount = data.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const lastPage = Math.max(totalPages - 1, 0);
  const currentPage = Math.min(unsafeCurrent, lastPage);

  const paginate = useCallback(
    (pageNumber: number) => {
      setCurrent(Math.min(Math.max(pageNumber, 0), lastPage));
    },
    [lastPage]
  );

  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const currentItems = data.slice(start, end);

  useEffect(() => {
    if (unsafeCurrent !== currentPage) {
      setCurrent(currentPage);
    }
  }, [unsafeCurrent, currentPage]);

  return {
    totalCount,
    currentPage,
    currentItems,
    paginate,
    itemsPerPage,
  };
};
