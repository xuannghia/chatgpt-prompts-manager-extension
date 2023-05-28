import { Box, Title } from '@mantine/core'
import { ThemeProvider } from '~components/theme-provider'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HomePage from '~pages/home'
import AddPage from '~pages/add'
import EditPage from '~pages/edit'

function IndexPopup() {
  return (
    <ThemeProvider>
      <div style={{ width: 500 }}>
        <Box bg="gray.3" p={4}>
          <Title order={1} size={12} align="center">
            ChatGPT Prompts Manager
          </Title>
        </Box>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add" element={<AddPage />} />
            <Route path="/edit/:id" element={<EditPage />} />
          </Routes>
        </MemoryRouter>
      </div>
    </ThemeProvider>
  )
}

export default IndexPopup
