import { Office, IOffice } from '../models/Office.js';
import { Jurisdiction, IJurisdiction } from '../models/Jurisdiction.js';

export interface OfficeSuggestionResult {
  officeId: string;
  officeName: string;
  officeNameMr?: string;
  officeNameHi?: string;
  jurisdictionName?: string;
  jurisdictionId?: string;
  slaHours: number;
  confidence: 'high' | 'medium' | 'fallback';
}

export class OfficeRoutingService {
  /**
   * Suggests the best responsible office for a reported civic issue given
   * GPS coordinates [longitude, latitude] and category ('roads', 'water', etc.).
   */
  static async suggestOffice(params: {
    coordinates: [number, number]; // [lng, lat]
    category: string;
  }): Promise<OfficeSuggestionResult> {
    const [lng, lat] = params.coordinates;
    const category = params.category?.toLowerCase() || 'general';

    // 1. Find all active jurisdictions containing the coordinates
    let matchingJurisdictions: IJurisdiction[] = [];
    try {
      matchingJurisdictions = await Jurisdiction.find({
        active: true,
        boundary: {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
          },
        },
      });
    } catch {
      matchingJurisdictions = [];
    }

    // 2. Sort by specificity: ward (1) > prabhag (2) > zone (3) > hq (4)
    const typeRank: Record<string, number> = {
      ward: 1,
      prabhag: 2,
      zone: 3,
      hq: 4,
    };
    matchingJurisdictions.sort((a, b) => (typeRank[a.type] || 99) - (typeRank[b.type] || 99));

    // 3. For each jurisdiction in order of specificity, look for an office matching category
    for (const jurisdiction of matchingJurisdictions) {
      const categoryOffice = await Office.findOne({
        jurisdictionId: jurisdiction._id,
        $or: [
          { supportedCategories: category },
          { department: category },
        ],
      });

      if (categoryOffice) {
        const slaHours = this.resolveSlaHours(categoryOffice, category, jurisdiction.slaHoursDefault);
        return {
          officeId: categoryOffice._id.toString(),
          officeName: categoryOffice.name,
          officeNameMr: categoryOffice.nameMr,
          officeNameHi: categoryOffice.nameHi,
          jurisdictionName: jurisdiction.name,
          jurisdictionId: jurisdiction._id.toString(),
          slaHours,
          confidence: 'high',
        };
      }
    }

    // 4. If no specific department office found, try finding general office at most specific jurisdiction
    for (const jurisdiction of matchingJurisdictions) {
      const generalOffice = await Office.findOne({
        jurisdictionId: jurisdiction._id,
      });

      if (generalOffice) {
        const slaHours = this.resolveSlaHours(generalOffice, category, jurisdiction.slaHoursDefault);
        return {
          officeId: generalOffice._id.toString(),
          officeName: generalOffice.name,
          officeNameMr: generalOffice.nameMr,
          officeNameHi: generalOffice.nameHi,
          jurisdictionName: jurisdiction.name,
          jurisdictionId: jurisdiction._id.toString(),
          slaHours,
          confidence: 'medium',
        };
      }
    }

    // 5. Fallback: HQ or general corporation office
    const fallbackOffice =
      (await Office.findOne({
        $or: [{ level: 'corporation' }, { department: 'general' }],
      })) || (await Office.findOne());

    if (fallbackOffice) {
      return {
        officeId: fallbackOffice._id.toString(),
        officeName: fallbackOffice.name,
        officeNameMr: fallbackOffice.nameMr,
        officeNameHi: fallbackOffice.nameHi,
        jurisdictionName: 'PCMC HQ',
        slaHours: this.resolveSlaHours(fallbackOffice, category, 48),
        confidence: 'fallback',
      };
    }

    // Ultimate safeguard fallback
    return {
      officeId: '000000000000000000000000',
      officeName: 'Central Municipal Headquarters',
      slaHours: 48,
      confidence: 'fallback',
    };
  }

  static resolveSlaHours(office: IOffice, category: string, fallbackHours = 48): number {
    if (office.slaHours) {
      if (typeof office.slaHours === 'number') {
        return office.slaHours;
      }
      if (typeof office.slaHours === 'object') {
        const record = office.slaHours as Record<string, number>;
        if (record[category]) return record[category];
        if (record.default) return record.default;
      }
    }
    return fallbackHours;
  }
}
