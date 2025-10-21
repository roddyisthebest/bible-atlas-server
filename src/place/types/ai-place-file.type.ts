export interface AiPlaceData {
  id: string;
  name: string;
  koreanName: string;
  imageTitle: string;
  isModern: boolean;
  stereo: 'parent' | 'child';
  description: string;
  koreanDescription: string;
  verses: string[];
  placeUrl: string;
  identificationPaths: string[];
  types: string[];
  unknownPlacePossibility: number | null;
  geojsonText: string;
}

export interface AiPlaceRelation {
  parentId: string;
  childId: string;
  possibility: number;
}

export interface AiPlaceFile {
  data: AiPlaceData[];
  relations: AiPlaceRelation[];
}
