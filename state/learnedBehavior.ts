export interface LearnedBehavior {
  responseLength: 'very_short' | 'short' | 'medium' | 'deep';
  initiativeLevel: 'minimal' | 'contextual' | 'proactive';
  toneProfile: 'calm_human' | 'assertive' | 'academic';
}

export const defaultLearnedBehavior: LearnedBehavior = {
  responseLength: 'short',
  initiativeLevel: 'contextual',
  toneProfile: 'calm_human'
};