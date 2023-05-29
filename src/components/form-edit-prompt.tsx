import { Button, Group, Input, SimpleGrid, TextInput, Textarea } from '@mantine/core'
import { nanoid } from 'nanoid'
import { type FC } from 'react'
import { useForm } from 'react-hook-form'

import type { Prompt } from '~types/prompt.type'

interface FormEditPromptProps {
  prompt?: Prompt
  onSubmit: (data: Prompt) => void
}

interface FormState {
  title: string
  prompt: string
  start?: number
  end?: number
}

export const FormEditPrompt: FC<FormEditPromptProps> = ({ prompt: defaultPrompt, onSubmit }) => {
  const { register, setValue, getValues, handleSubmit, formState } = useForm<FormState>({
    defaultValues: {
      title: defaultPrompt?.title || '',
      prompt: defaultPrompt?.prompt || '',
      start: defaultPrompt?.selection?.[0] || undefined,
      end: defaultPrompt?.selection?.[1] || undefined,
    },
  })

  const handleFormSubmit = (data: FormState) => {
    const prompt: Prompt = {
      id: defaultPrompt?.id || nanoid(),
      title: data.title,
      prompt: data.prompt,
      selection: data.start && data.end ? [data.start, data.end] : undefined,
    }
    onSubmit(prompt)
  }

  return (
    <div>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <TextInput
          required
          label="Title"
          placeholder="Enter a title"
          type="text"
          mb="xs"
          {...register('title')}
        />
        <Textarea
          required
          label="Prompt"
          placeholder="Enter a prompt"
          mb="xs"
          minRows={4}
          onSelect={(e) => {
            const { selectionStart, selectionEnd } = e.target as HTMLTextAreaElement
            if (selectionStart < selectionEnd) {
              setValue('start', selectionStart)
              setValue('end', selectionEnd)
            }
          }}
          {...register('prompt')}
        />
        <Input.Label>Selection range</Input.Label>
        <Input.Description mb={4}>
          When filling the prompt into the ChatGPT input, this range will be automatically selected
        </Input.Description>
        <SimpleGrid cols={2} mb={4}>
          <TextInput
            type="number"
            placeholder="Start"
            error={formState.errors.start?.message}
            {...register('start', {
              min: {
                value: 0,
                message: 'Start must be greater than or equal to 0',
              },
              validate: (value) => {
                const end = getValues('end')
                if (end && !value) return 'Start is required when end is filled'
                return true
              },
            })}
          />
          <TextInput
            type="number"
            placeholder="End"
            error={formState.errors.end?.message}
            {...register('end', {
              validate: (value) => {
                const start = getValues('start')
                if (!start && !value) return true
                if (value <= start) return 'End must be greater than start'
                const prompt = getValues('prompt')
                if (value > prompt?.length) return 'End must be less than or equal to prompt length'
                return true
              },
            })}
          />
        </SimpleGrid>
        <Group position="right" mt="lg">
          <Button type="submit">{defaultPrompt ? 'Update prompt' : 'Add prompt'}</Button>
        </Group>
      </form>
    </div>
  )
}
