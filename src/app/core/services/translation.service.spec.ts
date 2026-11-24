import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';

describe('TranslationService keys', () => {
  let service: TranslationService;

  const requiredKeys = [
    'notif.operation_failed',
    'reminders.empty_title',
    'reminders.empty_desc',
    'reminders.new_title',
    'budgets.updated',
    'budgets.update_failed',
    'budgets.period',
    'budgets.period_monthly',
    'budgets.period_yearly',
    'budgets.created',
    'budgets.create_failed',
    'budgets.deleted',
    'budgets.delete_failed',
    'banks.unexpected_response',
    'banks.connect_failed',
    'banks.disconnect_failed',
    'settings.session_invalid',
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranslationService);
  });

  it('translates all required keys in Spanish', () => {
    service.setLang('es');
    for (const key of requiredKeys) {
      expect(service.translate(key)).not.toBe(key);
    }
  });

  it('translates all required keys in English', () => {
    service.setLang('en');
    for (const key of requiredKeys) {
      expect(service.translate(key)).not.toBe(key);
    }
  });
});
