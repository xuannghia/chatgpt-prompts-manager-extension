import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { Flex, Kbd, Paper, ScrollArea, Text } from '@mantine/core'
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from 'plasmo'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useStorage } from '@plasmohq/storage/hook'
import { PromptItem } from '~components/prompt-item'
import { ThemeProvider } from '~components/theme-provider'
import type { Prompt } from '~types/prompt.type'
import { animationFrame } from '~utils/animation-frame'

const styleElement = document.createElement('style')

const styleCache = createCache({
  key: 'plasmo-emotion-cache',
  prepend: true,
  container: styleElement,
})

export const config: PlasmoCSConfig = {
  matches: ['https://chat.openai.com/*', 'https://chatgpt.com/*'],
}

export const getStyle = () => styleElement

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => ({
  element: document.querySelector('#prompt-textarea'),
  insertPosition: 'afterend',
})

const PromptSuggestionsContent = () => {
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark')
  const [prompts] = useStorage<Prompt[]>('prompts', [])
  const [selectedId, setSelectedId] = useState('')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const height = useMemo(() => {
    return open && window.location.pathname === '/' ? 320 : 400
  }, [open])

  const results = useMemo(() => {
    return prompts.filter((item) => {
      return item.prompt.toLowerCase().includes(search) || item.title.toLowerCase().includes(search)
    })
  }, [prompts, search])

  const [inputDom, setInputDom] = useState<HTMLDivElement>(null)
  const { x, y, width } = inputDom
    ? inputDom.parentElement.getBoundingClientRect()
    : { x: 0, y: 0, width: 0 }
  const listRef = useRef<HTMLDivElement>(null)

  const handleSetInput = useCallback((event: InputEvent) => {
    const currentTarget = event.currentTarget as HTMLDivElement
    const input = currentTarget?.innerText
    const text = input.toLowerCase()
    setSearch(text)
  }, [])

  const handleSelectItem = useCallback(
    (item: Prompt) => {
      if (inputDom) {
        let promptHTML = ''
        const lines = item.prompt.split('\n')
        lines.forEach((line) => {
          const p = document.createElement('p')
          p.innerText = line
          promptHTML += p.outerHTML
        })

        inputDom.innerHTML = promptHTML
        const event = new Event('input', { bubbles: true })
        inputDom.dispatchEvent(event)
        if (item.selection) {
          const range = document.createRange()
          const paragraphs = inputDom.querySelectorAll('p')
          const start = item.selection[0]
          const end = item.selection[1]
          let charCount = 0
          let startNode = null
          let endNode = null
          let startOffset = 0
          let endOffset = 0
          lines.forEach((line, index) => {
            const textLength = line.length
            if (!startNode && charCount + textLength >= start) {
              startNode = paragraphs[index].firstChild
              startOffset = start - charCount
            }
            if (!endNode && charCount + textLength >= end) {
              endNode = paragraphs[index].firstChild
              endOffset = end - charCount
            }
            charCount += textLength + 1 // +1 for the \n character has been removed by split
          })
          if (startNode && endNode) {
            range.setStart(startNode, startOffset)
            range.setEnd(endNode, endOffset)
            const selection = window.getSelection()
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }
      }
      setOpen(false)
      setSearch('')
    },
    [inputDom],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const currentTarget = event.currentTarget as HTMLDivElement
      const input = currentTarget?.innerText

      // Press `Ctrl + /` or`/` with empty input to open the prompt panel
      if (event.key === '/' && ((!input && !open) || event.ctrlKey)) {
        setOpen(true)
        setSearch('')
        event.preventDefault()
        return
      }
      if (event.key === '/') {
        setOpen(false)
        setSearch('')
        return
      }
      if (!results.length || !open) return
      const index = results.findIndex((item) => item.id === selectedId)
      const item = results.find((item) => item.id === selectedId)
      switch (event.key) {
        case 'Escape':
          setSearch('')
          setOpen(false)
          event.preventDefault()
          break
        case 'ArrowDown':
          if (index === results.length - 1) {
            setSelectedId(results[0].id)
          } else {
            setSelectedId(results[index + 1].id)
          }
          event.preventDefault()
          break
        case 'ArrowUp':
          if (index === 0) {
            setSelectedId(results[results.length - 1].id)
          } else {
            setSelectedId(results[index - 1].id)
          }
          event.preventDefault()
          break
        case 'Enter':
        case 'Tab':
          if (item) {
            handleSelectItem(item)
            event.preventDefault()
          }
          break
        default:
          break
      }
    },
    [handleSelectItem, results, selectedId, open],
  )

  useEffect(() => {
    const cancelAnimationFrame = animationFrame(() => {
      const prompt = document.getElementById('prompt-textarea') as HTMLInputElement
      if (prompt) {
        setInputDom(prompt)
        cancelAnimationFrame()
      }
    }, 300)
  }, [])

  useEffect(() => {
    if (inputDom) {
      inputDom.addEventListener('input', handleSetInput)
      inputDom.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      if (inputDom) {
        inputDom.removeEventListener('input', handleSetInput)
        inputDom.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown, handleSetInput, inputDom])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.id !== 'prompt-textarea') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const html = document.querySelector('html')
    if (html) {
      const scheme = html.classList.contains('dark') ? 'dark' : 'light'
      setColorScheme(scheme)
    }
  }, [])

  useEffect(() => {
    if (results.length > 0) {
      setSelectedId(results[0]?.id)
    }
  }, [results])

  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.querySelector(`#prompt-item-${selectedId}.active`)?.scrollIntoView({
        block: 'nearest',
      })
    }
  }, [selectedId])

  useLayoutEffect(() => {
    // Fix the issue where the style is not re-inserted when changing the ChatGPT conversation
    styleCache.inserted = {}
  }, [])

  if (results.length === 0 || !open) return null

  return (
    <CacheProvider value={styleCache}>
      <ThemeProvider emotionCache={styleCache} colorScheme={colorScheme}>
        <div style={{ position: 'fixed', left: x, bottom: window.innerHeight - y + 12, width }}>
          <Paper radius="md" p={6} role="listbox" shadow="lg" withBorder>
            <Flex mb="xs">
              <Text size="xs">
                Press <Kbd>↑</Kbd> <Kbd>↓</Kbd> to navigate and <Kbd>Tab</Kbd> to select
              </Text>
              <Text size="xs" ml="auto">
                <Kbd>Esc</Kbd> to close
              </Text>
            </Flex>
            <Text size="xs" mb="xs">
              {search ? `Search results for "${search}"` : 'Type anything to search'}
            </Text>
            <ScrollArea
              h={height}
              type="auto"
              ref={listRef}
              sx={{ '& > div > div': { display: 'block!important' } }}
            >
              {results.map((item) => (
                <PromptItem
                  key={item.id}
                  id={`prompt-item-${item.id}`}
                  className={selectedId === item.id ? 'active' : ''}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedId(item.id)}
                >
                  <Text>{item.title}</Text>
                  <Text truncate size="sm" color="dimmed">
                    {item.prompt}
                  </Text>
                </PromptItem>
              ))}
            </ScrollArea>
          </Paper>
        </div>
      </ThemeProvider>
    </CacheProvider>
  )
}

export default PromptSuggestionsContent
