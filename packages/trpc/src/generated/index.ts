// ── AppRouter Type Stubs — MANUALLY MAINTAINED ──
// Update when adding/removing procedures from backend routers.
// See docs/TRPC_SETUP_GUIDE.md Section 7 for the type stub pattern.

import type {
  // Animal
  AnimalResponse,
  AnimalListResponse,
  FindAnimalByTagRequest,
  AnimalListRequest,
  CreateAnimalRequest,
  UpdateAnimalRequest,
  // Archive
  ArchiveDocumentListRequest,
  CreateArchiveDocumentRequest,
  ArchiveInspectionFormRequest,
  ArchiveDocumentResponse,
  // Correction
  CorrectionResponse,
  CorrectionListResponse,
  CorrectionListRequest,
  CreateCorrectionRequest,
  ReviewCorrectionRequest,
  ResolveCorrectionRequest,
  EscalateCorrectionRequest,
  // EarTag
  EarTagResponse,
  EarTagListResponse,
  EarTagListRequest,
  EarTagTypeResponse,
  OrderStatusTransition,
  CreateOrderRequest,
  CancelOrderRequest,
  CancelOrderItemRequest,
  AppendToOrderRequest,
  // Farm
  FarmResponse,
  FarmListResponse,
  FarmListRequest,
  CreateFarmRequest,
  UpdateFarmRequest,
  AddressResponse,
  // Health
  DiseaseResponse,
  VaccineResponse,
  VaccineBatchResponse,
  VaccinationResponse,
  TreatmentResponse,
  DiseaseListRequest,
  CreateDiseaseRequest,
  VaccineListRequest,
  CreateVaccineRequest,
  CreateVaccineBatchRequest,
  VaccinationListRequest,
  RecordVaccinationRequest,
  TreatmentListRequest,
  RecordTreatmentRequest,
  // Inspection
  InspectionResponse,
  InspectionListRequest,
  CreateInspectionRequest,
  ScheduleInspectionRequest,
  CompleteInspectionRequest,
  PrintInspectionFormRequest,
  // Movement
  MovementResponse,
  MovementListResponse,
  MovementListRequest,
  CreateMovementRequest,
  // Notification
  SendNotificationInput,
  MarkAsReadInput,
  // Organization
  OrganizationResponse,
  OrganizationSummary,
  CreateOrganizationRequest,
  // Passport
  PassportResponse,
  PassportListRequest,
  IssuePassportRequest,
  SeizePassportRequest,
  ReprintPassportRequest,
  // RBAC
  RoleResponse,
  RoleWithPermissionsResponse,
  PermissionResponse,
  AssignRoleToUserRequest,
  RevokeRoleFromUserRequest,
  // Subject
  SubjectResponse,
  SubjectSummary,
  CreateSubjectRequest,
  BindSubjectToFarmRequest,
  FarmSubjectBindingResponse,
  // User
  UserResponse,
  UserSummary,
  UserListRequest,
  CreateUserRequest,
  UpdateUserRequest,
} from "@rocky/validators/api";

export interface AppRouter {
  // ── Animal ──
  animal: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: AnimalResponse };
    };
    findByTag: {
      _def: { _input_in: FindAnimalByTagRequest; _output_out: AnimalResponse };
    };
    list: {
      _def: { _input_in: AnimalListRequest; _output_out: AnimalListResponse };
    };
    create: {
      _def: { _input_in: CreateAnimalRequest; _output_out: AnimalResponse };
    };
    update: {
      _def: {
        _input_in: UpdateAnimalRequest & { id: string };
        _output_out: AnimalResponse;
      };
    };
  };

  // ── Archive ──
  archive: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: ArchiveDocumentResponse };
    };
    list: {
      _def: {
        _input_in: ArchiveDocumentListRequest;
        _output_out: { data: ArchiveDocumentResponse[]; total: number };
      };
    };
    create: {
      _def: {
        _input_in: CreateArchiveDocumentRequest;
        _output_out: ArchiveDocumentResponse;
      };
    };
    markArchived: {
      _def: { _input_in: { id: string }; _output_out: ArchiveDocumentResponse };
    };
    markDestroyed: {
      _def: { _input_in: { id: string }; _output_out: ArchiveDocumentResponse };
    };
    archiveInspectionForm: {
      _def: {
        _input_in: ArchiveInspectionFormRequest;
        _output_out: ArchiveDocumentResponse;
      };
    };
  };

  // ── Correction ──
  correction: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: CorrectionResponse };
    };
    list: {
      _def: {
        _input_in: CorrectionListRequest;
        _output_out: CorrectionListResponse;
      };
    };
    create: {
      _def: {
        _input_in: CreateCorrectionRequest;
        _output_out: CorrectionResponse;
      };
    };
    review: {
      _def: {
        _input_in: ReviewCorrectionRequest;
        _output_out: CorrectionResponse;
      };
    };
    resolve: {
      _def: {
        _input_in: ResolveCorrectionRequest;
        _output_out: CorrectionResponse;
      };
    };
    escalate: {
      _def: {
        _input_in: EscalateCorrectionRequest;
        _output_out: CorrectionResponse;
      };
    };
    reject: {
      _def: { _input_in: { id: string }; _output_out: CorrectionResponse };
    };
  };

  // ── EarTag ──
  earTag: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: EarTagResponse };
    };
    list: {
      _def: { _input_in: EarTagListRequest; _output_out: EarTagListResponse };
    };
    findByNumber: {
      _def: {
        _input_in: { stateCode: string; tagNumber: string };
        _output_out: EarTagResponse;
      };
    };
    getType: {
      _def: { _input_in: { id: string }; _output_out: EarTagTypeResponse };
    };
    listTypes: {
      _def: { _input_in: void; _output_out: EarTagTypeResponse[] };
    };
    transitionStatus: {
      _def: {
        _input_in: OrderStatusTransition;
        _output_out: EarTagResponse;
      };
    };
    createOrder: {
      _def: { _input_in: CreateOrderRequest; _output_out: EarTagResponse };
    };
    cancelOrder: {
      _def: { _input_in: CancelOrderRequest; _output_out: EarTagResponse };
    };
    cancelOrderItem: {
      _def: {
        _input_in: CancelOrderItemRequest;
        _output_out: EarTagResponse;
      };
    };
    appendToOrder: {
      _def: { _input_in: AppendToOrderRequest; _output_out: EarTagResponse };
    };
  };

  // ── Farm ──
  farm: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: FarmResponse };
    };
    getByFarmId: {
      _def: { _input_in: { farmId: string }; _output_out: FarmResponse };
    };
    list: {
      _def: { _input_in: FarmListRequest; _output_out: FarmListResponse };
    };
    create: {
      _def: { _input_in: CreateFarmRequest; _output_out: FarmResponse };
    };
    update: {
      _def: {
        _input_in: { id: string } & UpdateFarmRequest;
        _output_out: FarmResponse;
      };
    };
    getAddress: {
      _def: { _input_in: { id: string }; _output_out: AddressResponse };
    };
  };

  // ── Health ──
  health: {
    getDisease: {
      _def: { _input_in: { id: string }; _output_out: DiseaseResponse };
    };
    listDiseases: {
      _def: {
        _input_in: DiseaseListRequest;
        _output_out: { data: DiseaseResponse[]; total: number };
      };
    };
    createDisease: {
      _def: { _input_in: CreateDiseaseRequest; _output_out: DiseaseResponse };
    };
    getVaccine: {
      _def: { _input_in: { id: string }; _output_out: VaccineResponse };
    };
    listVaccines: {
      _def: {
        _input_in: VaccineListRequest;
        _output_out: { data: VaccineResponse[]; total: number };
      };
    };
    createVaccine: {
      _def: { _input_in: CreateVaccineRequest; _output_out: VaccineResponse };
    };
    createVaccineBatch: {
      _def: {
        _input_in: CreateVaccineBatchRequest;
        _output_out: VaccineBatchResponse;
      };
    };
    getVaccination: {
      _def: { _input_in: { id: string }; _output_out: VaccinationResponse };
    };
    listVaccinations: {
      _def: {
        _input_in: VaccinationListRequest;
        _output_out: { data: VaccinationResponse[]; total: number };
      };
    };
    recordVaccination: {
      _def: {
        _input_in: RecordVaccinationRequest;
        _output_out: VaccinationResponse;
      };
    };
    getTreatment: {
      _def: { _input_in: { id: string }; _output_out: TreatmentResponse };
    };
    listTreatments: {
      _def: {
        _input_in: TreatmentListRequest;
        _output_out: { data: TreatmentResponse[]; total: number };
      };
    };
    recordTreatment: {
      _def: {
        _input_in: RecordTreatmentRequest;
        _output_out: TreatmentResponse;
      };
    };
  };

  // ── Inspection ──
  inspection: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: InspectionResponse };
    };
    list: {
      _def: {
        _input_in: InspectionListRequest;
        _output_out: { data: InspectionResponse[]; total: number };
      };
    };
    create: {
      _def: {
        _input_in: CreateInspectionRequest;
        _output_out: InspectionResponse;
      };
    };
    schedule: {
      _def: {
        _input_in: ScheduleInspectionRequest;
        _output_out: InspectionResponse;
      };
    };
    complete: {
      _def: {
        _input_in: CompleteInspectionRequest;
        _output_out: InspectionResponse;
      };
    };
    printForm: {
      _def: {
        _input_in: PrintInspectionFormRequest;
        _output_out: InspectionResponse;
      };
    };
    listRiskAnalyses: {
      _def: {
        _input_in: {
          year?: number;
          status?: string;
          limit: number;
          offset: number;
        };
        _output_out: { data: unknown[]; total: number };
      };
    };
    runRiskAnalysis: {
      _def: {
        _input_in: {
          year: number;
          quarter?: string;
          selectionPercentage?: number;
        };
        _output_out: unknown;
      };
    };
  };

  // ── Movement ──
  movement: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: MovementResponse };
    };
    list: {
      _def: {
        _input_in: MovementListRequest;
        _output_out: MovementListResponse;
      };
    };
    create: {
      _def: {
        _input_in: CreateMovementRequest;
        _output_out: MovementResponse;
      };
    };
  };

  // ── Notification ──
  notification: {
    unreadCount: {
      _def: { _input_in: void; _output_out: { count: number } };
    };
    send: {
      _def: {
        _input_in: Omit<SendNotificationInput, "userId">;
        _output_out: unknown;
      };
    };
    markAsRead: {
      _def: {
        _input_in: Omit<MarkAsReadInput, "userId">;
        _output_out: unknown;
      };
    };
  };

  // ── Organization ──
  organization: {
    getById: {
      _def: {
        _input_in: { id: string };
        _output_out: OrganizationResponse;
      };
    };
    list: {
      _def: { _input_in: void; _output_out: OrganizationSummary[] };
    };
    listByType: {
      _def: {
        _input_in: { orgType: string };
        _output_out: OrganizationSummary[];
      };
    };
    create: {
      _def: {
        _input_in: CreateOrganizationRequest;
        _output_out: OrganizationResponse;
      };
    };
  };

  // ── Passport ──
  passport: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: PassportResponse };
    };
    list: {
      _def: {
        _input_in: PassportListRequest;
        _output_out: { data: PassportResponse[]; total: number };
      };
    };
    issueForAnimal: {
      _def: {
        _input_in: IssuePassportRequest;
        _output_out: PassportResponse;
      };
    };
    shipToVs: {
      _def: { _input_in: { id: string }; _output_out: PassportResponse };
    };
    deliverToKeeper: {
      _def: { _input_in: { id: string }; _output_out: PassportResponse };
    };
    seize: {
      _def: { _input_in: SeizePassportRequest; _output_out: PassportResponse };
    };
    reprint: {
      _def: {
        _input_in: ReprintPassportRequest;
        _output_out: PassportResponse;
      };
    };
  };

  // ── RBAC ──
  rbac: {
    listRoles: {
      _def: { _input_in: void; _output_out: RoleResponse[] };
    };
    getRole: {
      _def: {
        _input_in: { roleId: string };
        _output_out: RoleWithPermissionsResponse;
      };
    };
    listPermissions: {
      _def: { _input_in: void; _output_out: PermissionResponse[] };
    };
    assignRole: {
      _def: {
        _input_in: AssignRoleToUserRequest;
        _output_out: { assigned: boolean };
      };
    };
    revokeRole: {
      _def: {
        _input_in: RevokeRoleFromUserRequest;
        _output_out: { revoked: boolean };
      };
    };
  };

  // ── Subject ──
  subject: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: SubjectResponse };
    };
    search: {
      _def: {
        _input_in: { q: string; limit: number; offset: number };
        _output_out: { data: SubjectSummary[]; total: number };
      };
    };
    create: {
      _def: {
        _input_in: CreateSubjectRequest;
        _output_out: SubjectResponse;
      };
    };
    bindToFarm: {
      _def: {
        _input_in: BindSubjectToFarmRequest;
        _output_out: FarmSubjectBindingResponse;
      };
    };
    unbindFromFarm: {
      _def: {
        _input_in: { bindingId: string };
        _output_out: { deleted: boolean };
      };
    };
  };

  // ── User ──
  user: {
    getById: {
      _def: { _input_in: { id: string }; _output_out: UserResponse };
    };
    list: {
      _def: {
        _input_in: UserListRequest;
        _output_out: UserSummary[];
      };
    };
    create: {
      _def: { _input_in: CreateUserRequest; _output_out: UserResponse };
    };
    update: {
      _def: {
        _input_in: UpdateUserRequest & { id: string };
        _output_out: UserResponse;
      };
    };
  };
}
