import { teams, participants } from "~/db/schema";
import { queryBuilder } from "./utils/builder";

export const query = {
  participants: queryBuilder(participants, "participants"),
  teams: queryBuilder(teams, "teams"),
};
