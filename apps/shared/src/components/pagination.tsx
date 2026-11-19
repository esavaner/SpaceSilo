import styled from 'styled-components';
import { theme } from '../config/theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button as ButtonBase } from './button';
import { Input } from './input';
import { ArrowRight } from '../assets/icons';

const Container = styled.div`
  display: flex;
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
const LeftArrow = styled(ArrowRight)`
  transform: rotate(180deg);
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
      onKeyPress={(e) => {
        if (e.nativeEvent.key === 'Enter') {
          jump();
        }
      }}
    />
  );
};

type Props = React.HTMLAttributes<HTMLDivElement> & {
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
  // if there is only one page, don't show pagination
  if (totalCount <= perPage) {
    return <></>;
  }

  const totalPages = Math.ceil(totalCount / perPage);

  if (variant === 'simple') {
    return (
      <Container {...rest}>
        <ArrowButton variant="tertiary" disabled={currentPage <= 0} onClick={() => paginate(currentPage - 1)}>
          <LeftArrow />
        </ArrowButton>
        {jumper ? (
          <PageJumpInput key={currentPage} totalPages={totalPages} defaultPage={currentPage + 1} onJump={paginate} />
        ) : (
          <Button>{currentPage + 1}</Button>
        )}
        /
        <Button variant="tertiary" style={{ pointerEvents: 'none' }} tabIndex={-1}>
          {totalPages}
        </Button>
        <ArrowButton
          variant="tertiary"
          disabled={currentPage >= totalPages - 1}
          onClick={() => paginate(currentPage + 1)}
        >
          <ArrowRight />
        </ArrowButton>
      </Container>
    );
  }

  const leftDistance = currentPage;
  const rightDistance = totalPages - currentPage - 1;

  // always show current item in the middle,
  // if left / right distance are more than or equal to 4 -> show ...
  // if left / right distance are less than 4 -> show all items from that side
  return (
    <Container {...rest}>
      <ArrowButton variant="tertiary" disabled={currentPage <= 0} onClick={() => paginate(currentPage - 1)}>
        <LeftArrow /> Previous
      </ArrowButton>
      {leftDistance >= 4 && (
        <>
          <Button onClick={() => paginate(0)} variant="tertiary">
            1
          </Button>
          <Button variant="tertiary" style={{ pointerEvents: 'none' }} tabIndex={-1}>
            ...
          </Button>
          <Button onClick={() => paginate(currentPage - 1)} variant="tertiary">
            {currentPage}
          </Button>
        </>
      )}
      {leftDistance > 0 &&
        leftDistance < 4 &&
        Array(leftDistance)
          .fill(0)
          .map((_, i) => (
            <Button key={i} onClick={() => paginate(currentPage - i - 1)} variant="tertiary">
              {currentPage - i}
            </Button>
          ))
          .reverse()}
      <Button>{currentPage + 1}</Button>
      {rightDistance > 0 &&
        rightDistance < 4 &&
        Array(rightDistance)
          .fill(0)
          .map((_, i) => (
            <Button key={i} onClick={() => paginate(currentPage + i + 1)} variant="tertiary">
              {currentPage + i + 2}
            </Button>
          ))}
      {rightDistance >= 4 && (
        <>
          <Button onClick={() => paginate(currentPage + 1)} variant="tertiary">
            {currentPage + 2}
          </Button>
          <Button variant="tertiary" style={{ pointerEvents: 'none' }} tabIndex={-1}>
            ...
          </Button>
          <Button onClick={() => paginate(totalPages - 1)} variant="tertiary">
            {totalPages}
          </Button>
        </>
      )}
      <ArrowButton
        variant="tertiary"
        disabled={currentPage >= totalPages - 1}
        onClick={() => paginate(currentPage + 1)}
      >
        Next <ArrowRight />
      </ArrowButton>
      {jumper && (
        <>
          Go to{' '}
          <PageJumpInput key={currentPage} totalPages={totalPages} defaultPage={currentPage + 1} onJump={paginate} />
          page
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
