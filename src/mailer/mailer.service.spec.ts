import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as nodemailer from 'nodemailer'
import { MailerService } from './mailer.service'

// Mock nodemailer
jest.mock('nodemailer')
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>

// Mock fs
jest.mock('node:fs')
const mockFs = fs as jest.Mocked<typeof fs>

// Mock path
jest.mock('node:path')
const mockPath = path as jest.Mocked<typeof path>

// Mock Handlebars
jest.mock('handlebars', () => ({
  default: {
    compile: jest.fn(),
  },
  compile: jest.fn(),
}))

describe('MailerService', () => {
  let service: MailerService
  let configService: jest.Mocked<ConfigService>
  let mockTransporter: {
    sendMail: jest.MockedFunction<nodemailer.Transporter['sendMail']>
  }

  const mockConfig = {
    MAIL_HOST: 'smtp.test.com',
    MAIL_PORT: 587,
    MAIL_USER: 'test@example.com',
    MAIL_PASS: 'password123',
    MAIL_FROM: 'noreply@remal.ma',
  }

  beforeAll(() => {
    // Set up environment variable mock before any tests run
    process.env.MAIL_FROM = mockConfig.MAIL_FROM
  })

  afterAll(() => {
    // Clean up environment variables
    delete process.env.MAIL_FROM
  })

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
    }

    // Mock nodemailer.createTransporter
    mockNodemailer.createTransport.mockReturnValue(
      mockTransporter as unknown as nodemailer.Transporter,
    )

    // Create mock config service
    const mockConfigService = {
      get: jest.fn((key: string) => mockConfig[key]),
    }

    // Create a minimal test module with only the necessary providers
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<MailerService>(MailerService)
    configService = module.get(ConfigService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should create nodemailer transporter with correct configuration', () => {
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: mockConfig.MAIL_HOST,
        port: mockConfig.MAIL_PORT,
        secure: false,
        auth: {
          user: mockConfig.MAIL_USER,
          pass: mockConfig.MAIL_PASS,
        },
      })
    })

    it('should call config service for all required values', () => {
      expect(configService.get).toHaveBeenCalledWith('MAIL_HOST')
      expect(configService.get).toHaveBeenCalledWith('MAIL_PORT')
      expect(configService.get).toHaveBeenCalledWith('MAIL_USER')
      expect(configService.get).toHaveBeenCalledWith('MAIL_PASS')
    })
  })

  describe('sendVerificationCodeMail', () => {
    const mockTemplateContent =
      '<html><body>Your code: {{#each codeDigits}}{{this}}{{/each}}</body></html>'
    const mockCompiledTemplate = '<html><body>Your code: 123456</body></html>'
    const mockSendMailResult = {
      messageId: 'test-message-id-123',
      envelope: { from: 'noreply@remal.ma', to: ['test@example.com'] },
    }

    beforeEach(() => {
      // Mock fs.existsSync to return true for the first path (dist folder)
      mockFs.existsSync.mockReturnValue(true)

      // Mock fs.readFileSync to return template content
      mockFs.readFileSync.mockReturnValue(mockTemplateContent)

      // Mock path.join to return expected paths
      mockPath.join.mockImplementation((...args) => args.join('/'))

      // Mock Handlebars compile and template execution
      const Handlebars = require('handlebars')
      const mockTemplate = jest.fn().mockReturnValue(mockCompiledTemplate)
      Handlebars.default.compile.mockReturnValue(mockTemplate)
      Handlebars.compile.mockReturnValue(mockTemplate)

      // Mock successful email sending
      mockTransporter.sendMail.mockResolvedValue(mockSendMailResult)
    })

    it('should send verification email successfully with English template', async () => {
      const to = 'test@example.com'
      const context = { codeDigits: ['1', '2', '3', '4', '5', '6'] }

      const result = await service.sendVerificationCodeMail(to, 'en', context)

      // Verify template path resolution
      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String),
        'mailer/templates',
        'en/verify-code.hbs',
      )

      // Verify template reading
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('en/verify-code.hbs'),
        'utf8',
      )

      // Verify email sending
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"Mahal-Remal" <${mockConfig.MAIL_FROM}>`,
        to,
        subject: 'Your Verification Code - رمز التحقق الخاص بك',
        html: mockCompiledTemplate,
      })

      expect(result).toEqual(mockSendMailResult)
    })

    it('should send verification email successfully with Arabic template', async () => {
      const to = 'test@example.com'
      const context = { codeDigits: ['1', '2', '3', '4', '5', '6'] }

      await service.sendVerificationCodeMail(to, 'ar', context)

      // Verify Arabic template path is used
      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String),
        'mailer/templates',
        'ar/verify-code.hbs',
      )
    })

    it('should default to English template when no language specified', async () => {
      const to = 'test@example.com'
      const context = { codeDigits: ['1', '2', '3', '4', '5', '6'] }

      await service.sendVerificationCodeMail(to, undefined, context)

      // Verify English template path is used by default
      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String),
        'mailer/templates',
        'en/verify-code.hbs',
      )
    })

    it('should fallback to src/templates path when dist path does not exist', async () => {
      // Mock first existsSync call to return false (dist folder doesn't exist)
      // and second call to return true (src folder exists)
      mockFs.existsSync.mockReturnValueOnce(false)

      const to = 'test@example.com'
      const context = { codeDigits: ['1', '2', '3', '4', '5', '6'] }

      await service.sendVerificationCodeMail(to, 'en', context)

      // Verify both path attempts
      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String),
        'mailer/templates',
        'en/verify-code.hbs',
      )
      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String),
        'templates',
        'en/verify-code.hbs',
      )

      // Verify fallback path is used for reading
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('templates/en/verify-code.hbs'),
        'utf8',
      )
    })

    it('should throw error when template file cannot be read', async () => {
      const readError = new Error('File not found')
      mockFs.readFileSync.mockImplementation(() => {
        throw readError
      })

      const to = 'test@example.com'
      const context = { codeDigits: ['1', '2', '3', '4', '5', '6'] }

      await expect(
        service.sendVerificationCodeMail(to, 'en', context),
      ).rejects.toThrow(readError)
    })

    it('should throw error when email sending fails', async () => {
      const sendError = new Error('SMTP connection failed')
      mockTransporter.sendMail.mockRejectedValue(sendError)

      const to = 'test@example.com'
      const context = { codeDigits: ['1', '2', '3', '4', '5', '6'] }

      await expect(
        service.sendVerificationCodeMail(to, 'en', context),
      ).rejects.toThrow(sendError)
    })

    it('should handle template compilation errors', async () => {
      const Handlebars = require('handlebars')
      const compileError = new Error('Template compilation failed')
      Handlebars.default.compile.mockImplementation(() => {
        throw compileError
      })
      Handlebars.compile.mockImplementation(() => {
        throw compileError
      })

      const to = 'test@example.com'
      const context = { codeDigits: ['1', '2', '3', '4', '5', '6'] }

      await expect(
        service.sendVerificationCodeMail(to, 'en', context),
      ).rejects.toThrow(compileError)
    })

    it('should handle template execution errors', async () => {
      const Handlebars = require('handlebars')
      const executionError = new Error('Template execution failed')
      const mockTemplate = jest.fn().mockImplementation(() => {
        throw executionError
      })
      Handlebars.default.compile.mockReturnValue(mockTemplate)
      Handlebars.compile.mockReturnValue(mockTemplate)

      const to = 'test@example.com'
      const context = { codeDigits: ['1', '2', '3', '4', '5', '6'] }

      await expect(
        service.sendVerificationCodeMail(to, 'en', context),
      ).rejects.toThrow(executionError)
    })

    it('should pass context correctly to template', async () => {
      const Handlebars = require('handlebars')
      const mockTemplate = jest.fn().mockReturnValue(mockCompiledTemplate)
      Handlebars.default.compile.mockReturnValue(mockTemplate)
      Handlebars.compile.mockReturnValue(mockTemplate)

      const to = 'test@example.com'
      const context = {
        codeDigits: ['1', '2', '3', '4', '5', '6'],
        userName: 'John Doe',
      }

      await service.sendVerificationCodeMail(to, 'en', context)

      expect(mockTemplate).toHaveBeenCalledWith(context)
    })
  })
})
