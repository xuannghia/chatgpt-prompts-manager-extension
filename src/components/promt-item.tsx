import styled from '@emotion/styled'

export const PromptItem = styled.div`
  display: block;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  &.active,
  &:hover,
  &:focus {
    background-color: ${({ theme }) => (theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2])};
  }
`
