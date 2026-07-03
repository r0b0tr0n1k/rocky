interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppRouter {
  health: {
    ping: {
      _def: { _input_in: void; _output_out: string };
    };
  };
  todo: {
    list: {
      _def: { _input_in: { completed?: boolean }; _output_out: Todo[] };
    };
    getById: {
      _def: { _input_in: { id: string }; _output_out: Todo | null };
    };
    create: {
      _def: { _input_in: { title: string }; _output_out: Todo };
    };
    update: {
      _def: { _input_in: { id: string; title?: string; completed?: boolean }; _output_out: Todo | null };
    };
    delete: {
      _def: { _input_in: { id: string }; _output_out: { deleted: boolean } };
    };
  };
}
