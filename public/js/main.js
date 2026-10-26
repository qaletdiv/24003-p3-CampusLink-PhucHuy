// Vanilla JavaScript for shared UI interactions.
// Everything here is an enhancement: pages still work (and the server still validates) without it.

document.addEventListener('DOMContentLoaded', () => {
  setUpNavToggle();
  setUpConfirmForms(); // must run before setUpBusyForms so a cancelled confirm is seen as "prevented"
  setUpBusyForms();
  setUpHelpRequestForm();
  setUpCheckboxToggles();
  focusErrorSummary();
});

// Open/close the menu on phones
function setUpNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// <form data-confirm="Are you sure?"> asks before submitting
function setUpConfirmForms() {
  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (!window.confirm(form.dataset.confirm)) event.preventDefault();
    });
  });
}

// While a form is being sent: show a spinner on its button and disable it,
// so a slow connection doesn't lead to double posts.
function setUpBusyForms() {
  document.querySelectorAll('form[method="post"]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (event.defaultPrevented) return; // e.g. the user said "Cancel" in a confirm dialog

      const button = form.querySelector('button[type="submit"]');
      form.setAttribute('aria-busy', 'true');
      if (button) {
        button.classList.add('is-busy');
        // Disable on the next tick: disabling during the submit event can cancel it in some browsers
        setTimeout(() => {
          button.disabled = true;
        }, 0);
      }
    });
  });

  // Pages restored with the Back button come from cache with buttons still disabled
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    document.querySelectorAll('form[aria-busy="true"]').forEach((form) => {
      form.removeAttribute('aria-busy');
      form.querySelectorAll('button.is-busy').forEach((button) => {
        button.classList.remove('is-busy');
        button.disabled = false;
      });
    });
  });
}

// Help request form and session proposal form: show the location field only for
// in-person help, and show the "confirm change" box only when the support type changed.
function setUpHelpRequestForm() {
  const form = document.querySelector('.help-form');
  if (!form) return;

  const locationField = form.querySelector('[data-show-when-mode="in_person"]');
  const confirmBox = form.querySelector('[data-mode-change-confirm]');
  const originalMode = form.dataset.originalMode;

  function update() {
    const checked = form.querySelector('input[type="radio"]:checked');
    const mode = checked ? checked.value : '';

    if (locationField) locationField.hidden = mode !== 'in_person';
    if (confirmBox) {
      const changed = Boolean(originalMode) && mode !== originalMode;
      confirmBox.hidden = !changed;
      if (!changed) confirmBox.querySelector('input').checked = false;
    }
  }

  form.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.addEventListener('change', update);
  });
  update();
}

// <input type="checkbox" data-toggles="some-id"> shows the element #some-id only while ticked
function setUpCheckboxToggles() {
  document.querySelectorAll('input[type="checkbox"][data-toggles]').forEach((checkbox) => {
    const target = document.getElementById(checkbox.dataset.toggles);
    if (!target) return;

    const update = () => {
      target.hidden = !checkbox.checked;
    };
    checkbox.addEventListener('change', update);
    update();
  });
}

// After a failed submit, move keyboard/screen-reader focus to the list of errors
function focusErrorSummary() {
  const summary = document.querySelector('.error-summary[tabindex="-1"]');
  if (summary) summary.focus();
}
