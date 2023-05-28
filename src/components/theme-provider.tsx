import { type EmotionCache } from '@emotion/cache'
import { Global } from '@emotion/react'
import { type ColorScheme, MantineProvider } from '@mantine/core'
import type { FC, PropsWithChildren } from 'react'

interface Props extends PropsWithChildren {
  emotionCache?: EmotionCache
  colorScheme?: ColorScheme
}

export const ThemeProvider: FC<Props> = ({ emotionCache, children, colorScheme }) => {
  return (
    <MantineProvider withGlobalStyles emotionCache={emotionCache} theme={{ colorScheme: colorScheme }}>
      <Global
        styles={{
          body: {
            margin: 0,
          },
        }}
      />
      {children}
    </MantineProvider>
  )
}
