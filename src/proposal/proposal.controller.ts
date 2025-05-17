import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';

@Controller('proposal')
@UseInterceptors(ClassSerializerInterceptor)
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  create(
    @Body() createProposalDto: CreateProposalDto,
    @UserId() creatorId: number,
  ) {
    return this.proposalService.create(createProposalDto, creatorId);
  }

  @Get()
  findAll(@Query() findAllDto: PagePaginationDto) {
    return this.proposalService.findAll(findAllDto);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.proposalService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateProposalDto: UpdateProposalDto,
    @UserId() userId: number,
  ) {
    return this.proposalService.update(id, updateProposalDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @UserId() userId: number) {
    return this.proposalService.remove(id, userId);
  }
}
