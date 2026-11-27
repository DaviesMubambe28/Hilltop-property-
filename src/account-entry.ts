import { config } from './config';
import { buildSignInUrl } from './auth-navigation';
import { currentProfile } from './services/auth';
import {
  AccountAccessError,
  reportAccountFailure,
  type AccountAccessStage,
} from './account-access';

const main = document.querySelector<HTMLElement>('.account-main');
const state = document.querySelector<HTMLElement>('#account-entry-state');
const signOutButton = document.querySelector<HTMLButtonElement>('#account-signout');

if (main) main.hidden = true;
if (signOutButton) {
  signOutButton.hidden = true;
  signOutButton.addEventListener('click', () => {
    location.href = '/sign-out.html';
  });
}

function showState(heading: string, description: string, allowRetry = true): void {
  if (main) main.hidden = true;
  if (!state) return;
  state.hidden = false;
  state.removeAttribute('aria-busy');
  state.replaceChildren();
  const label = document.createElement('p');
  label.className = 'eyebrow';
  label.textContent = 'MY HILLTOP';
  const title = document.createElement('h1');
  title.textContent = heading;
  const copy = document.createElement('p');
  copy.textContent = description;
  const actions = document.createElement('div');
  actions.className = 'account-state-actions';
  if (allowRetry) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'button button-yellow';
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => location.reload());
    actions.append(retry);
  }
  const home = document.createElement('a');
  home.className = 'button button-dark';
  home.href = '/';
  home.textContent = 'Return home';
  actions.append(home);
  state.append(label, title, copy, actions);
}

function withAccountTimeout<T>(operation: Promise<T>): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new AccountAccessError('account-initialize', { code: 'account_timeout', status: 408 }));
      }, 12000);
    }),
  ]);
}

async function initializeAccount() {
  if (!config) {
    showState(
      'Account services are not connected.',
      'You can still browse properties or contact Hilltop for assistance.',
      false,
    );
    return;
  }
  let stage: AccountAccessStage = 'auth-user';
  try {
    const session = await withAccountTimeout(currentProfile());
    if (!session) {
      location.replace(buildSignInUrl('/account.html'));
      return;
    }
    if (signOutButton) signOutButton.hidden = false;
    if (!session.profile.is_active) {
      showState('Your account is unavailable.', 'Please contact Hilltop for assistance.', false);
      return;
    }
    stage = 'account-import';
    const accountModule = await withAccountTimeout(import('./account'));
    stage = 'account-initialize';
    await withAccountTimeout(accountModule.mountAccount(session));
    if (state) state.hidden = true;
    if (main) main.hidden = false;
  } catch (error) {
    reportAccountFailure(stage, error);
    const failedStage = error instanceof AccountAccessError ? error.stage : stage;
    if (failedStage === 'profile-read') {
      if (signOutButton) signOutButton.hidden = false;
      showState(
        'We could not load your profile.',
        'Your account information is temporarily unavailable. Try again or sign out and sign in again.',
      );
    } else if (failedStage === 'auth-user') {
      showState('We could not verify your session.', 'Check your connection and try again.');
    } else {
      showState(
        'We could not open your account.',
        'Some account services are temporarily unavailable. Please try again.',
      );
    }
  }
}

void initializeAccount();
