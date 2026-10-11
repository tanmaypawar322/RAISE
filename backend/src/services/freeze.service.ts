import mongoose from 'mongoose';
import { FreezeWindow, IFreezeWindow } from '../models/FreezeWindow.js';
import { config } from '../config/env.js';

export class FreezeService {
  /**
   * Checks whether an election model code of conduct freeze is currently active
   */
  static async isElectionFreezeActive(
    jurisdictionId?: string | mongoose.Types.ObjectId,
    role?: string
  ): Promise<{ isFrozen: boolean; freezeWindow?: IFreezeWindow | null }> {
    if (!config.electionFreezeEnabled) {
      return { isFrozen: false, freezeWindow: null };
    }
    if (!jurisdictionId) {
      return { isFrozen: false, freezeWindow: null };
    }

    const now = new Date();
    const query: any = {
      jurisdictionId,
      isActive: true,
      freezeStart: { $lte: now },
      freezeEnd: { $gte: now },
    };

    if (role) {
      query.$or = [{ roles: { $size: 0 } }, { roles: role }];
    }

    const activeFreeze = await FreezeWindow.findOne(query);
    if (activeFreeze) {
      return { isFrozen: true, freezeWindow: activeFreeze };
    }

    return { isFrozen: false, freezeWindow: null };
  }

  /**
   * Checks if any containing jurisdiction is under election freeze
   */
  static async areAnyJurisdictionsFrozen(
    jurisdictionIds: Array<string | mongoose.Types.ObjectId>
  ): Promise<{ isFrozen: boolean; freezeWindow?: IFreezeWindow | null }> {
    if (!config.electionFreezeEnabled || !jurisdictionIds || jurisdictionIds.length === 0) {
      return { isFrozen: false, freezeWindow: null };
    }

    const now = new Date();
    const activeFreeze = await FreezeWindow.findOne({
      jurisdictionId: { $in: jurisdictionIds },
      isActive: true,
      freezeStart: { $lte: now },
      freezeEnd: { $gte: now },
    });

    if (activeFreeze) {
      return { isFrozen: true, freezeWindow: activeFreeze };
    }

    return { isFrozen: false, freezeWindow: null };
  }
}
