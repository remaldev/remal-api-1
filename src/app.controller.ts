import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { Public } from './auth/decorators'

@Controller()
export class AppController {
  private readonly appService: AppService

  constructor(appService: AppService) {
    this.appService = appService
  }

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello()
  }
}
