import { productionCommunityGuard } from '../_productionGuard';

export default function handler(_request: unknown, response: Parameters<typeof productionCommunityGuard>[0]) {
  productionCommunityGuard(response);
}
