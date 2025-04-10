import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { DataSource, Repository } from 'typeorm';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { CommonService } from 'src/common/common.service';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    private readonly commonService: CommonService,
  ) {}

  create(createProposalDto: CreateProposalDto, creatorId: number) {
    return null;
  }

  async findAll(dto: PagePaginationDto) {
    const { limit, page } = dto;

    const qb = this.proposalRepository
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.creator', 'user')
      .leftJoinAndSelect('proposal.place', 'place');

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });

    let [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data: instanceToPlain(data),
    };
  }

  async findOne(id: number) {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['creator', 'place'],
    });

    if (!proposal) {
      throw new NotFoundException('존재하지 않은 제안입니다.');
    }

    return proposal;
  }

  async update(
    id: number,
    updateProposalDto: UpdateProposalDto,
    userId: number,
  ) {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!proposal) {
      throw new NotFoundException('존재하지 않은 제안입니다.');
    }

    const isCreator = proposal.creator.id === userId;

    if (!isCreator) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    await this.proposalRepository.update({ id }, { ...updateProposalDto });

    const updatedProposal = await this.proposalRepository.findOne({
      where: { id },
    });

    return updatedProposal;
  }

  async remove(id: number, userId: number) {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!proposal) {
      throw new NotFoundException('존재하지 않은 제안입니다.');
    }

    const isCreator = proposal.creator.id === userId;

    if (!isCreator) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    await this.proposalRepository.softDelete({ id });

    return id;
  }
}
