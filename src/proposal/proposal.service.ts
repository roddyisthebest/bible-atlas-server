import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Proposal, ProposalType } from './entities/proposal.entity';
import { Repository } from 'typeorm';
import { Location } from 'src/location/entities/location.entity';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { CommonService } from 'src/common/common.service';
import { ProposalAgreement } from './entities/proposal-agreement.entity';
import { UserProposalReport } from 'src/user/entities/user-proposal-report.entity';
import { CreateProposalReportDto } from './dto/create-proposal-report.dto';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly commonService: CommonService,
    @InjectRepository(ProposalAgreement)
    private readonly proposalAgreementRepository: Repository<ProposalAgreement>,
    @InjectRepository(UserProposalReport)
    private readonly userProposalReportRepository: Repository<UserProposalReport>,
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

  async findOne(id: number) {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['creator', 'location'],
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
    await this.proposalAgreementRepository.softDelete({ proposal: { id } });

    const deletedLocation = this.proposalRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    return deletedLocation;
  }

  async toggleProposalAgreement(
    proposalId: number,
    userId: number,
    isAgree: boolean,
  ) {
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
      relations: ['creator'],
    });

    if (!proposal) {
      throw new NotFoundException('존재하지 않은 제안입니다.');
    }

    const isCreator = proposal.creator.id === userId;

    if (isCreator) {
      throw new BadRequestException('작성자는 투표할 권한이 없습니다.');
    }

    const agreeRecord = await this.proposalAgreementRepository
      .createQueryBuilder('pa')
      .leftJoinAndSelect('pa.proposal', 'proposal')
      .leftJoinAndSelect('pa.user', 'user')
      .where('proposal.id = :proposalId', { proposalId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (agreeRecord) {
      if (isAgree === agreeRecord.isAgree) {
        await this.proposalAgreementRepository.delete({
          proposal,
          user: { id: userId },
        });

        return { message: 'agreement가 삭제되었습니다.' };
      } else {
        await this.proposalAgreementRepository.update(
          { proposal, user: { id: userId } },
          { isAgree },
        );

        return { message: 'agreement가 수정되었습니다.', isAgree };
      }
    } else {
      await this.proposalAgreementRepository.save({
        proposal,
        user: { id: userId },
        isAgree,
      });

      return { message: 'agreement가 생성되었습니다.', isAgree };
    }
  }
  async reportProposal(
    id: number,
    createReportDto: CreateProposalReportDto,
    userId: number,
  ) {
    const proposal = await this.proposalRepository.findOne({ where: { id } });

    if (!proposal) {
      throw new NotFoundException('존재하지 않는 id 값의 제안입니다.');
    }

    const newReport = await this.userProposalReportRepository.save({
      proposal,
      user: { id: userId },
      ...createReportDto,
    });

    return newReport;
  }
}
