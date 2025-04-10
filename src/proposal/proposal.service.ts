import {
  BadRequestException,
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
import { Place } from 'src/place/entities/place.entity';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,

    private readonly commonService: CommonService,
  ) {}

  async create(createProposalDto: CreateProposalDto, creatorId: number) {
    const { comment, type, placeId } = createProposalDto;

    const isCreate = type === 0;

    if (isCreate && placeId) {
      throw new BadRequestException('생성 제안은 장소 정보가 필요 없습니다.');
    }

    if (placeId) {
      const place = await this.placeRepository.findOne({
        where: { id: placeId },
      });

      if (!place) {
        throw new BadRequestException('존재하지 않은 장소입니다.');
      }
      const { id: newProposalId } = await this.proposalRepository.save({
        comment,
        type,
        creator: { id: creatorId },
        place,
      });

      const newProposal = await this.proposalRepository.findOne({
        where: { id: newProposalId },
      });

      return newProposal;
    }
    const { id: newProposalId } = await this.proposalRepository.save({
      comment,
      type,
      creator: { id: creatorId },
    });

    const newProposal = await this.proposalRepository.findOne({
      where: { id: newProposalId },
    });

    return newProposal;
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

    const isCreate = updateProposalDto.type === 0;

    if (isCreate && updateProposalDto.placeId) {
      throw new BadRequestException('생성 제안은 장소 정보가 필요 없습니다.');
    }

    if (updateProposalDto.placeId) {
      const place = await this.placeRepository.findOne({
        where: { id: updateProposalDto.placeId },
      });

      if (!place) {
        throw new BadRequestException('존재하지 않은 장소입니다.');
      }

      const { placeId, ...rest } = updateProposalDto;

      await this.proposalRepository.update({ id }, { ...rest, place });
      const updatedProposal = await this.proposalRepository.findOne({
        where: { id },
        relations: ['place', 'creator'],
      });

      return updatedProposal;
    }

    await this.proposalRepository.update({ id }, { ...updateProposalDto });

    const updatedProposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['place', 'creator'],
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

    await this.proposalRepository.delete({ id });

    return id;
  }
}
