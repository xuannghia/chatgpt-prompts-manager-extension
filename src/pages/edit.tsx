import { Anchor, Box, Button, Group, Modal, Title } from '@mantine/core'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useStorage } from '@plasmohq/storage/hook'

import { FormEditPrompt } from '~components/form-edit-prompt'
import { IconTrash } from '~icons/IconTrash'
import type { Prompt } from '~types/prompt.type'

export default function EditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [modalDeleteOpened, setModalDeleteOpened] = useState(false)
  const [prompts, setPrompts] = useStorage<Prompt[]>('prompts', [])
  const selectedPrompt = prompts.find((prompt) => prompt.id === id)

  const handleSubmit = (prompt: Prompt) => {
    setPrompts(prompts.map((p) => (p.id === prompt.id ? prompt : p)))
    navigate(-1)
  }

  const handleCloseDeleteModal = () => {
    setModalDeleteOpened(false)
  }

  const handleConfirmDelete = () => {
    setPrompts(prompts.filter((prompt) => prompt.id !== id))
    navigate(-1)
  }

  return (
    <Box p="xs" mih={300}>
      <Modal
        opened={modalDeleteOpened}
        onClose={handleCloseDeleteModal}
        title="Are you sure you want to delete this prompt?"
        centered
        size="sm"
      >
        <Group position="right">
          <Anchor size="sm" onClick={handleCloseDeleteModal}>
            Cancel
          </Anchor>
          <Button color="red" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>

      <Group position="apart">
        <Anchor size="sm" onClick={() => navigate(-1)}>
          Back
        </Anchor>
        <Button
          variant="light"
          color="red"
          onClick={() => setModalDeleteOpened(true)}
          leftIcon={<IconTrash size={20} />}
        >
          Delete
        </Button>
      </Group>
      <Title mb="xs" order={3}>
        Update prompt
      </Title>
      {selectedPrompt && <FormEditPrompt prompt={selectedPrompt} onSubmit={handleSubmit} />}
    </Box>
  )
}
