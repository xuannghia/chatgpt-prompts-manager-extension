import { ActionIcon, Box, Button, Group, Input, ScrollArea, Text } from '@mantine/core'
import { useStorage } from '@plasmohq/storage/hook'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PromptItem } from '~components/promt-item'
import { IconPlus } from '~icons/IconPlus'
import { IconSearch } from '~icons/IconSearch'
import { IconX } from '~icons/IconX'
import { useAppStore } from '~store/app.store'
import type { Prompt } from '~types/prompt.type'

export default function HomePage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [promptsStored] = useStorage<Prompt[]>('prompts', [])
  const location = useLocation()
  const [latestY, setLatestY] = useState(0)
  const { searchInput, storeRestoration, actions } = useAppStore()

  const prompts = useMemo(
    () =>
      promptsStored.filter((prompt) => {
        const search = searchInput.toLowerCase()
        return prompt.prompt.toLowerCase().includes(search) || prompt.title.toLowerCase().includes(search)
      }),
    [promptsStored, searchInput],
  )

  const handleScrollChange = (position: { y: number }) => {
    setLatestY(position.y)
  }

  useLayoutEffect(() => {
    return () => {
      const key = location.key
      actions.setStoreRestoration(key, latestY)
    }
  }, [latestY, location.key, actions])

  useLayoutEffect(() => {
    const key = location.key
    const scrollY = storeRestoration.get(key) || 0
    if (scrollY) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollY })
      }, 30)
    }
  }, [location.key, storeRestoration])

  return (
    <Box>
      <Box px="xs" pt="xs">
        <Group>
          <Box sx={{ flex: 'auto' }}>
            <Input
              autoFocus
              placeholder="Search prompt"
              icon={<IconSearch size={20} />}
              rightSection={
                searchInput && (
                  <ActionIcon onClick={() => actions.setSearchInput('')}>
                    <IconX size={20} />
                  </ActionIcon>
                )
              }
              value={searchInput}
              onChange={(e) => actions.setSearchInput(e.target.value)}
            />
          </Box>
          <Button component={Link} to="/add" leftIcon={<IconPlus size={20} />}>
            Add
          </Button>
        </Group>
      </Box>
      <ScrollArea
        h={400}
        type="auto"
        p="xs"
        viewportRef={scrollRef}
        onScrollPositionChange={handleScrollChange}
        sx={{ '& > div > div': { display: 'block!important' } }}
      >
        <Box>
          {prompts.length === 0 && (
            <Text my="lg" align="center" size="sm" color="dimmed">
              No prompts found
            </Text>
          )}
          {prompts.map((prompt) => (
            <PromptItem
              key={prompt.id}
              onClick={() => {
                navigate(`/edit/${prompt.id}`)
              }}
            >
              <Text>{prompt.title}</Text>
              <Text truncate size="sm" color="dimmed">
                {prompt.prompt}
              </Text>
            </PromptItem>
          ))}
        </Box>
      </ScrollArea>
    </Box>
  )
}
