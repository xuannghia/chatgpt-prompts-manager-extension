import { Anchor, Box, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useStorage } from '@plasmohq/storage/hook'
import { FormEditPrompt } from '~components/form-edit-prompt'
import type { Prompt } from '~types/prompt.type'

export default function AddPage() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useStorage<Prompt[]>('prompts', [])

  const handleSubmit = (prompt: Prompt) => {
    setPrompts([prompt, ...prompts])
    navigate(-1)
  }

  return (
    <Box p="xs">
      <Anchor component="button" size="sm" onClick={() => navigate(-1)}>
        Back
      </Anchor>
      <Title mb="xs" order={3}>
        Add new prompt
      </Title>
      <FormEditPrompt onSubmit={handleSubmit} />
    </Box>
  )
}
