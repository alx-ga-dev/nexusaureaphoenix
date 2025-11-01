type PageHeaderProps = {
    title: string;
    description: string;
  };
  
  export function PageHeader({ title, description }: PageHeaderProps) {
    return (
      <header className="p-4 md:p-6 border-b">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </header>
    );
  }