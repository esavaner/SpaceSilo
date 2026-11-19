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
      onChangeText={(text) => setValue(text.replace(/\D/g, ''))}
      onKeyPress={(event) => {
        if (event.nativeEvent.key === 'Enter') {
          jump();
        }
      }}
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

  if (variant === 'simple') {
    return (
      <Container {...rest}>
        <ArrowButton variant="tertiary" disabled={currentPage <= 0} onPress={() => paginate(currentPage - 1)}>
          <ArrowLeft />
        </ArrowButton>
        {jumper ? (
          <PageJumpInput key={currentPage} totalPages={totalPages} defaultPage={currentPage + 1} onJump={paginate} />
        ) : (
          <Button>{currentPage + 1}</Button>
        )}
        <Text.M>/</Text.M>
        <Button variant="tertiary" style={{ pointerEvents: 'none' }} tabIndex={-1}>
          {totalPages}
        </Button>
        <ArrowButton
          variant="tertiary"
          disabled={currentPage >= totalPages - 1}
          onPress={() => paginate(currentPage + 1)}
        >
          <ArrowRight />
        </ArrowButton>
      </Container>
    );
  }

  const leftDistance = currentPage;
  const rightDistance = totalPages - currentPage - 1;

  return (
    <Container {...rest}>
      <ArrowButton variant="tertiary" disabled={currentPage <= 0} onPress={() => paginate(currentPage - 1)}>
        <ArrowLeft /> Previous
      </ArrowButton>
      {leftDistance >= 4 && (
        <>
          <Button onPress={() => paginate(0)} variant="tertiary">
            1
          </Button>
          <Button variant="tertiary" style={{ pointerEvents: 'none' }} tabIndex={-1}>
            ...
          </Button>
          <Button onPress={() => paginate(currentPage - 1)} variant="tertiary">
            {currentPage}
          </Button>
        </>
      )}
      {leftDistance > 0 &&
        leftDistance < 4 &&
        Array(leftDistance)
          .fill(0)
          .map((_, index) => (
            <Button key={index} onPress={() => paginate(currentPage - index - 1)} variant="tertiary">
              {currentPage - index}
            </Button>
          ))
          .reverse()}
      <Button>{currentPage + 1}</Button>
      {rightDistance > 0 &&
        rightDistance < 4 &&
        Array(rightDistance)
          .fill(0)
          .map((_, index) => (
            <Button key={index} onPress={() => paginate(currentPage + index + 1)} variant="tertiary">
              {currentPage + index + 2}
            </Button>
          ))}
      {rightDistance >= 4 && (
        <>
          <Button onPress={() => paginate(currentPage + 1)} variant="tertiary">
            {currentPage + 2}
          </Button>
          <Button variant="tertiary" style={{ pointerEvents: 'none' }} tabIndex={-1}>
            ...
          </Button>
          <Button onPress={() => paginate(totalPages - 1)} variant="tertiary">
            {totalPages}
          </Button>
        </>
      )}
      <ArrowButton
        variant="tertiary"
        disabled={currentPage >= totalPages - 1}
        onPress={() => paginate(currentPage + 1)}
      >
        Next <ArrowRight />
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
