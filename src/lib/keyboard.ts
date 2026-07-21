type EditableEventTarget = EventTarget & {
  nodeName?: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => Element | null;
};

export function isTextEntryTarget(target: EventTarget | null) {
  if (!target || typeof target !== 'object') return false;
  const element = target as EditableEventTarget;
  const nodeName = element.nodeName?.toLowerCase();
  if (nodeName === 'input' || nodeName === 'textarea' || nodeName === 'select') return true;
  if (element.isContentEditable) return true;
  return Boolean(element.closest?.('[contenteditable="true"]'));
}
