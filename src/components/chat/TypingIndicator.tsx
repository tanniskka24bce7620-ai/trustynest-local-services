const TypingIndicator = ({ name }: { name: string }) => (
  <div className="flex justify-start">
    <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5 shadow-soft">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
        </div>
        <span className="text-[10px] text-muted-foreground">{name} is typing…</span>
      </div>
    </div>
  </div>
);

export default TypingIndicator;
