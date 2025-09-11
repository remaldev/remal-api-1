import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Handlebars from 'handlebars'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)
  private transporter: nodemailer.Transporter

  constructor(configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('MAIL_HOST'),
      port: configService.get<number>('MAIL_PORT'),
      secure: false, // true for port 465
      auth: {
        user: configService.get<string>('MAIL_USER'),
        pass: configService.get<string>('MAIL_PASS'),
      },
    })
  }
  private compileTemplate<T extends Record<string, unknown>>(
    templateName: string,
    context: T,
  ): string {
    // case when running in dist folder
    let filePath = path.join(
      __dirname,
      'mailer/templates',
      `${templateName}.hbs`,
    )
    // Fallback to src/mailer/templates if run through JEST
    // jest runs the code in the src folder without compiling it to dist
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'templates', `${templateName}.hbs`)
    }
    const templateSource = fs.readFileSync(filePath, 'utf8')
    const template = Handlebars.compile(templateSource)
    return template(context)
  }

  async sendVerificationCodeMail(
    to: string,
    language: 'en' | 'ar' = 'en',
    context: { [key: string]: unknown },
  ) {
    try {
      const html = this.compileTemplate(`${language}/verify-code`, context)
      const info = await this.transporter.sendMail({
        from: `"Mahal-Remal" <${process.env.MAIL_FROM}>`,
        to,
        subject: 'Your Verification Code - رمز التحقق الخاص بك',
        html,
      })
      this.logger.log(`Mail sent to ${to}: ${info.messageId}`)
      return info
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err.stack)
      throw err
    }
  }
}
