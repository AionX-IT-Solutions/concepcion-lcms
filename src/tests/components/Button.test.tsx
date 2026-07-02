import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../renderer/src/components/ui/Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('fires onClick handler', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows spinner SVG when loading', () => {
    const { container } = render(<Button loading>Submit</Button>)
    // spinner is an SVG rendered instead of leftIcon
    expect(container.querySelector('svg')).toBeInTheDocument()
    // children still render alongside spinner
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })

  it('is disabled when loading prop is true', () => {
    render(<Button loading>Submit</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders left icon when provided', () => {
    render(<Button leftIcon={<span data-testid="icon" />}>Label</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
