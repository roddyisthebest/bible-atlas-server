import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Proposal, ProposalType } from './entities/proposal.entity';
import { Repository } from 'typeorm';
import { Location } from 'src/location/entities/location.entity';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly commonService: CommonService,
  ) {}

  create(createProposalDto: CreateProposalDto, creatorId: number) {
    switch (createProposalDto.type) {
      case ProposalType.CREATE:
        return this.createLocationProposal(createProposalDto, creatorId);
      case ProposalType.UPDATE:
        return this.createLocationUpdateProposal(createProposalDto, creatorId);
      case ProposalType.DELETE:
        return this.createLocationDeletionProposal(
          createProposalDto,
          creatorId,
        );
      default:
        throw new BadRequestException('잘못된 제안 타입입니다.');
    }
  }

  async createLocationProposal(
    createProposalDto: CreateProposalDto,
    creatorId: number,
  ) {
    const haveRequiredDto =
      !!createProposalDto.newLatitude &&
      !!createProposalDto.newLongitude &&
      !!createProposalDto.newLocationName &&
      !!createProposalDto.newLocationDescription;

    if (!haveRequiredDto) {
      throw new BadRequestException('필수 정보가 누락되었습니다.');
    }

    const {
      newLocationName,
      newLocationDescription,
      comment,
      newLatitude,
      newLongitude,
    } = createProposalDto;

    const location = await this.locationRepository.findOne({
      where: [
        { latitude: newLatitude, longitude: newLongitude },
        { name: newLocationName },
      ],
    });

    if (location) {
      throw new BadRequestException('이미 등록된 지역입니다.');
    }

    const { id } = await this.proposalRepository.save({
      type: ProposalType.CREATE,
      newLocationName,
      newLocationDescription,
      newLatitude,
      newLongitude,
      comment,
      creator: {
        id: creatorId,
      },
    });

    const newProposal = await this.proposalRepository.findOne({
      where: { id },
    });

    return newProposal;
  }

  async createLocationUpdateProposal(
    createProposalDto: CreateProposalDto,
    creatorId: number,
  ) {
    const haveLocationId = !!createProposalDto.locationId;

    const haveRequiredDto =
      (!!createProposalDto.newLatitude && !!createProposalDto.newLongitude) ||
      !!createProposalDto.newLocationName ||
      !!createProposalDto.newLocationDescription;

    if (!haveRequiredDto || !haveLocationId) {
      throw new BadRequestException('필수 정보가 누락되었습니다.');
    }

    const {
      newLocationName,
      newLocationDescription,
      comment,
      newLatitude,
      newLongitude,
      locationId,
    } = createProposalDto;

    const location = await this.locationRepository.findOne({
      where: { id: locationId },
    });

    if (!location) {
      throw new BadRequestException('존재하지 않는 위치 정보입니다.');
    }

    if (newLatitude && newLongitude) {
      if (
        location.longitude === newLongitude &&
        location.latitude === newLatitude
      ) {
        throw new BadRequestException(
          '위치정보가 같습니다. 다른 위치정보를 보내주세요.',
        );
      }
    }

    const { id } = await this.proposalRepository.save({
      type: ProposalType.UPDATE,
      newLocationName,
      newLocationDescription,
      newLatitude,
      newLongitude,
      comment,
      location: {
        id: locationId,
      },
      creator: {
        id: creatorId,
      },
    });

    const newProposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['creator', 'location'],
    });

    return newProposal;
  }

  async createLocationDeletionProposal(
    createProposalDto: CreateProposalDto,
    creatorId: number,
  ) {
    const haveLocationId = !!createProposalDto.locationId;

    const haveRequiredDto = !!createProposalDto.comment;

    if (!haveRequiredDto || !haveLocationId) {
      throw new BadRequestException('필수 정보가 누락되었습니다.');
    }

    const { comment, locationId } = createProposalDto;

    const location = await this.locationRepository.findOne({
      where: { id: locationId },
    });

    if (!location) {
      throw new BadRequestException('존재하지 않는 위치 정보입니다.');
    }

    const { id } = await this.proposalRepository.save({
      type: ProposalType.DELETE,
      comment,
      location: {
        id: locationId,
      },
      creator: {
        id: creatorId,
      },
    });

    const newProposal = await this.proposalRepository.findOne({
      where: { id },
    });

    return newProposal;
  }

  async findAll(dto: PagePaginationDto) {
    const { limit, page } = dto;

    const qb = this.proposalRepository
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.creator', 'user')
      .leftJoinAndSelect('proposal.location', 'location');

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });

    let [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} proposal`;
  }

  update(id: number, updateProposalDto: UpdateProposalDto) {
    return `This action updates a #${id} proposal`;
  }

  remove(id: number) {
    return `This action removes a #${id} proposal`;
  }
}
