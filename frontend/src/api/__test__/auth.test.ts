import { login } from '../auth'
import client from '../client'
import { vi } from 'vitest'

vi.mock('../client')

describe('login', () => {
    it('should set token on successful login', async () => {
        const formData = new URLSearchParams({
            username: 'testuser',
            password: 'testpassword'
        })

        vi.mocked(client.post).mockResolvedValue({
            data: { access_token: 'fake-token' }
        })

        await login(formData)
        
        expect(client.post).toHaveBeenCalledWith('/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
    })

    it('should throw error when no token in response', async () => {
        const formData = new URLSearchParams({
            username: 'testuser',
            password: 'wrongpassword'
        })

        vi.mocked(client.post).mockResolvedValue({
            data: {}
        })

        await expect(login(formData)).rejects.toThrow('No token in response.')
    })
})
