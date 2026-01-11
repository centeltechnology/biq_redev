import { useState } from "react";
import { HelpCircle, Calculator, FileText, DollarSign, Settings, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type PageKey = "pricing-calculator" | "quote-builder" | "pricing" | "settings";

interface InstructionSection {
  title: string;
  content: string;
}

interface PageInstructions {
  title: string;
  icon: typeof Calculator;
  description: string;
  sections: InstructionSection[];
  proTip?: string;
}

const PAGE_INSTRUCTIONS: Record<PageKey, PageInstructions> = {
  "pricing-calculator": {
    title: "Price Calculator",
    icon: Calculator,
    description: "Calculate your costs and set profitable prices for any cake or treat.",
    sections: [
      {
        title: "How It Works",
        content: "Enter your material costs, labor hours, and overhead percentage. The calculator will compute your total costs and suggest a selling price based on your desired profit margin."
      },
      {
        title: "Saving Calculations",
        content: "Give your calculation a name and click Save to store it for future reference. You can load saved calculations anytime and use them as templates for similar orders."
      },
      {
        title: "Creating Quotes",
        content: "Click the document icon next to any saved calculation to instantly create a new quote with that item pre-filled. This saves time when quoting repeat items."
      },
      {
        title: "Adding to Quotes",
        content: "From the Quote Builder, use 'Add from Price Calculator' to search and add any of your saved calculations as line items, complete with cost breakdown tracking."
      },
      {
        title: "Featured Items (Basic & Pro)",
        content: "Basic and Pro users can feature calculations on their public calculator. Customers can select these items directly for quick ordering. Basic: 10 items, Pro: unlimited. Use the eye icon to control visibility."
      }
    ],
    proTip: "Set up calculations for your most popular items to speed up your quoting process!"
  },
  "quote-builder": {
    title: "Quote Builder",
    icon: FileText,
    description: "Create professional quotes to send to your customers.",
    sections: [
      {
        title: "Creating a Quote",
        content: "Select a customer (or create one), add a title, and set an event date if applicable. Then add line items for each product or service you're quoting."
      },
      {
        title: "Line Items",
        content: "Add items manually or pull them from your Price Calculator. Items from the calculator show a calculator icon with a cost breakdown tooltip when you hover over it."
      },
      {
        title: "From Price Calculator",
        content: "Click 'Add from Price Calculator' to search your saved calculations. Select one to add it as a line item with all the pricing details preserved."
      },
      {
        title: "Sending Quotes",
        content: "Once your quote is ready, click 'Send Quote' to email it to your customer. They'll receive a professional PDF with all the details."
      },
      {
        title: "Converting to Orders",
        content: "When a customer accepts, click 'Convert to Order' to move it to your calendar for fulfillment tracking."
      }
    ],
    proTip: "Use the notes field to include terms, deposit requirements, or special instructions!"
  },
  "pricing": {
    title: "Pricing Setup",
    icon: DollarSign,
    description: "Configure your base prices for cakes, treats, and delivery options.",
    sections: [
      {
        title: "Cake Pricing",
        content: "Set base prices by cake size and shape. These prices appear on your public calculator when customers build their cake requests."
      },
      {
        title: "Flavor & Frosting",
        content: "Configure prices for different cake flavors and frosting types. You can add premium pricing for specialty options."
      },
      {
        title: "Decorations & Add-ons",
        content: "Set up decoration categories and add-ons like cake toppers, edible images, or special finishes with their associated costs."
      },
      {
        title: "Treats",
        content: "Configure pricing for individual treats like cupcakes, cake pops, cookies, and more. Set per-unit prices that will be multiplied by quantity."
      },
      {
        title: "Delivery Options",
        content: "Define your delivery zones and pricing. You can offer pickup (free) or various delivery tiers based on distance or complexity."
      }
    ],
    proTip: "Review your pricing regularly to ensure it covers your costs and provides healthy margins!"
  },
  "settings": {
    title: "Settings",
    icon: Settings,
    description: "Manage your bakery profile, subscription, and account preferences.",
    sections: [
      {
        title: "Bakery Profile",
        content: "Update your bakery name, contact information, and public calculator URL slug. Your slug appears in your public calculator link that you share with customers."
      },
      {
        title: "Subscription Plan",
        content: "View your current plan and quote usage. Upgrade to Basic or Pro for more monthly quotes and premium features like Fast Quote."
      },
      {
        title: "Email Notifications",
        content: "Configure which email notifications you receive, including new lead alerts and quote activity updates."
      },
      {
        title: "Account Security",
        content: "Update your password and manage your account access. Keep your login credentials secure."
      },
      {
        title: "Data Export",
        content: "Export your customer data, quotes, and orders for backup or use in other systems."
      }
    ],
    proTip: "Customize your public calculator URL to match your bakery brand!"
  }
};

interface InstructionModalProps {
  page: PageKey;
  className?: string;
}

export function InstructionModal({ page, className }: InstructionModalProps) {
  const [open, setOpen] = useState(false);
  const instructions = PAGE_INSTRUCTIONS[page];
  const Icon = instructions.icon;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={className}
        data-testid={`button-help-${page}`}
        title="Help & Instructions"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              {instructions.title}
            </DialogTitle>
            <DialogDescription>{instructions.description}</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {instructions.sections.map((section, index) => (
                <div key={index} className="space-y-1">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    {section.title.includes("Pro") && (
                      <Sparkles className="h-3 w-3 text-primary" />
                    )}
                    {section.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{section.content}</p>
                </div>
              ))}
              
              {instructions.proTip && (
                <div className="mt-4 p-3 bg-primary/10 rounded-md">
                  <p className="text-sm flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span><strong>Pro Tip:</strong> {instructions.proTip}</span>
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function useInstructionModal(page: PageKey) {
  const [open, setOpen] = useState(false);
  
  return {
    open,
    setOpen,
    InstructionModalButton: () => <InstructionModal page={page} />,
  };
}
