import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LabApi, Schemas } from '../../core/api/lab-api.service';
import { pathState } from '../../core/research/path-state';
import { FindingReview } from '../findings/finding-review';

@Component({
  selector: 'app-opportunity-page',
  imports: [ReactiveFormsModule, FindingReview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './opportunity-page.html',
})
export class OpportunityPage implements OnInit {
  private readonly lab = inject(LabApi);
  private readonly forms = inject(FormBuilder);
  protected readonly findings = signal<Schemas['FindingResponse'][]>([]);
  protected readonly opportunityId = signal<string | null>(pathState.opportunityId());
  protected readonly status = signal<string | null>(null);
  protected readonly productSaved = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly opportunityForm = this.forms.nonNullable.group({
    title: ['', Validators.required],
    customerProblem: ['', Validators.required],
    targetCustomer: ['', Validators.required],
  });
  protected readonly productForm = this.forms.nonNullable.group({
    description: ['', Validators.required],
    targetBuyers: ['', Validators.required],
    differentiation: ['', Validators.required],
    estimatedCosts: ['', Validators.required],
    feasibility: ['', Validators.required],
  });
  protected readonly rationale = this.forms.nonNullable.control('', Validators.required);

  ngOnInit(): void {
    const directionId = pathState.directionId();
    if (!directionId) {
      return;
    }
    this.lab.findings(directionId).subscribe({
      next: (page) => this.findings.set(page.items ?? []),
      error: () => this.errorMessage.set('Findings could not be loaded.'),
    });
    const existing = pathState.opportunityId();
    if (existing) {
      this.lab.opportunity(existing).subscribe((opportunity) => this.status.set(opportunity.status ?? null));
    }
  }

  createOpportunity(): void {
    const findingIds = this.findings().map((finding) => finding.id).filter((id): id is string => !!id);
    if (this.opportunityForm.invalid || findingIds.length === 0) {
      this.opportunityForm.markAllAsTouched();
      this.errorMessage.set('A finding has to be on screen before an opportunity is saved.');
      return;
    }
    this.lab.createOpportunity(findingIds, this.opportunityForm.getRawValue()).subscribe({
      next: (opportunity) => {
        if (opportunity.id) {
          pathState.setOpportunityId(opportunity.id);
          this.opportunityId.set(opportunity.id);
        }
        this.status.set(opportunity.status ?? null);
        this.errorMessage.set(null);
      },
      error: () => this.errorMessage.set('The opportunity was not saved.'),
    });
  }

  addProduct(): void {
    const opportunityId = this.opportunityId();
    if (!opportunityId || this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.lab.addProduct(opportunityId, this.productForm.getRawValue()).subscribe({
      next: () => this.productSaved.set(true),
      error: () => this.errorMessage.set('The product concept was not saved.'),
    });
  }

  decide(decision: 'ADVANCE' | 'INVESTIGATE' | 'REDESIGN' | 'ARCHIVE'): void {
    const opportunityId = this.opportunityId();
    if (!opportunityId || this.rationale.invalid || this.findings().length === 0) {
      this.rationale.markAsTouched();
      return;
    }
    this.lab.decide(opportunityId, decision, this.rationale.value).subscribe({
      next: () => {
        this.lab.opportunity(opportunityId).subscribe((opportunity) => this.status.set(opportunity.status ?? null));
      },
      error: () => this.errorMessage.set('The decision was not recorded.'),
    });
  }
}
