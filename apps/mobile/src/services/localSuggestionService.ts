import { localDb } from "../storage/localDb";

function unique(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, 8);
}

export const localSuggestionService = {
  async getTaskTitles(query = "") {
    const tasks = await localDb.list("tasks");
    const q = query.trim().toLowerCase();
    return unique(tasks.map((task) => task.title)).filter((title) =>
      title.toLowerCase().includes(q),
    );
  },

  async getCompanies(query = "") {
    const [companies, shifts] = await Promise.all([
      localDb.list("companies"),
      localDb.list("workEntries"),
    ]);
    const q = query.trim().toLowerCase();
    return unique([
      ...companies.map((company) => company.name),
      ...shifts.map((shift) => shift.jobName),
    ]).filter((name) => name.toLowerCase().includes(q));
  },

  async getExpensePatterns() {
    const expenses = await localDb.list("expenses");
    return expenses.slice(0, 20).map((expense) => ({
      title: expense.title,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
    }));
  },

  async getGroceries(query = "") {
    const groceries = await localDb.list("groceries");
    const q = query.trim().toLowerCase();
    return unique(groceries.map((item) => item.name)).filter((name) =>
      name.toLowerCase().includes(q),
    );
  },

  async getCleaningRoutines(query = "") {
    const routines = await localDb.list("cleaningRoutines");
    const q = query.trim().toLowerCase();
    return unique(routines.map((routine) => routine.title)).filter((title) =>
      title.toLowerCase().includes(q),
    );
  },

  async getSplitMembers(query = "") {
    const members = await localDb.list("splitMembers");
    const q = query.trim().toLowerCase();
    return unique(members.map((member) => member.name)).filter((name) =>
      name.toLowerCase().includes(q),
    );
  },
};
