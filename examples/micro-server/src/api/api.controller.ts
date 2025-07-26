import { Controller, Get } from "@nestjs/common";
import { ApiService } from "./api.service";

@Controller("api-api")
export class ApiController {
  constructor(private readonly appService: ApiService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
