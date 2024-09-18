import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { Kbd, Paper, ScrollArea, Text } from '@mantine/core'
import type { PlasmoCSConfig, PlasmoMountShadowHost } from 'plasmo'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { useStorage } from '@plasmohq/storage/hook'

import { PromptItem } from '~components/promt-item'
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

export const mountShadowHost: PlasmoMountShadowHost = ({ shadowHost }) => {
  shadowHost.setAttribute('id', 'chatgpt-prompts-manager-shadow-host')
  shadowHost.setAttribute('style', 'visibility: visible;')
  // Because the hydration issue, we have to try to append the shadow host multiple times to make sure it's appended
  animationFrame(() => {
    const existing = document.getElementById('chatgpt-prompts-manager-shadow-host')
    if (!existing) document.body.appendChild(shadowHost)
  }, 500)
}

const PromptSuggestionsContent = () => {
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark')
  const [prompts] = useStorage<Prompt[]>('prompts', [])
  const [selectedId, setSelectedId] = useState('')
  const [results, setResults] = useState([])

  const [inputDom, setInputDom] = useState<HTMLDivElement>(null)
  const { x, y, width } = inputDom
    ? inputDom.parentElement.getBoundingClientRect()
    : { x: 0, y: 0, width: 0 }
  const listRef = useRef<HTMLDivElement>(null)

  const handleSetInput = useCallback(
    (event: InputEvent) => {
      const currentTarget = event.currentTarget as HTMLDivElement
      const input = currentTarget?.innerText
      const slash = input[0]
      if (!input || slash !== '/') {
        setResults([])
        return
      }
      const text = input.slice(1).toLowerCase()
      const data = prompts.filter((item) => {
        return item.prompt.toLowerCase().includes(text) || item.title.toLowerCase().includes(text)
      })
      setResults(data)
      setSelectedId(data[0]?.id)
    },
    [prompts],
  )

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
          });
          if (startNode && endNode) {
            range.setStart(startNode, startOffset)
            range.setEnd(endNode, endOffset)
            const selection = window.getSelection()
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }
      }
      setResults([])
    },
    [inputDom],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!results.length) return
      const index = results.findIndex((item) => item.id === selectedId)
      const item = results.find((item) => item.id === selectedId)
      switch (event.key) {
        case 'Escape':
          setResults([])
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
    [handleSelectItem, results, selectedId],
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
        setResults([])
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

  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.querySelector(`#prompt-item-${selectedId}.active`)?.scrollIntoView({
        block: 'nearest',
      })
    }
  }, [selectedId])

  if (results.length === 0) return null

  return (
    <CacheProvider value={styleCache}>
      <ThemeProvider emotionCache={styleCache} colorScheme={colorScheme}>
        <div style={{ position: 'fixed', left: x, bottom: window.innerHeight - y + 12, width }}>
          <Paper radius="md" p={6} role="listbox" shadow="lg" withBorder>
            <Text size="xs" style={{ marginBottom: 6 }}>
              Press <Kbd>Tab</Kbd> to select
            </Text>
            <ScrollArea
              h={400}
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
