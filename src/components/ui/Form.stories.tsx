"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";

const meta: Meta<typeof Form> = {
  title: "UI/Form",
  component: Form,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Form>;

// Schema for basic form
const basicFormSchema = z.object({
  username: z.string().min(2, {
    error: "Username must be at least 2 characters.",
  }),
  message: z.string().min(10, {
    error: "Message must be at least 10 characters.",
  }),
});

// Schema for validation form
const validationFormSchema = z.object({
  name: z.string().min(2, {
    error: "Name must be at least 2 characters.",
  }),
  age: z
    .number()
    .min(18, {
      error: "You must be at least 18 years old.",
    })
    .max(120, {
      error: "You must be at most 120 years old.",
    }),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, {
      error: "Please enter a valid phone number (10-11 digits).",
    })
    .optional(),
});

// Schema for complex form
const complexFormSchema = z.object({
  firstName: z.string().min(2, {
    error: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    error: "Last name must be at least 2 characters.",
  }),
  age: z
    .number()
    .min(18, {
      error: "You must be at least 18 years old.",
    })
    .max(120, {
      error: "You must be at most 120 years old.",
    }),
  bio: z
    .string()
    .min(10, {
      error: "Bio must be at least 10 characters.",
    })
    .max(160, {
      error: "Bio must be at most 160 characters.",
    })
    .optional(),
  terms: z.boolean().refine((value) => value === true, {
    error: "You must agree to the terms and conditions.",
  }),
});

function BasicFormDemo() {
  const form = useForm<z.infer<typeof basicFormSchema>>({
    resolver: zodResolver(basicFormSchema),
    defaultValues: {
      username: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof basicFormSchema>) {
    console.log("ℹ️ XXX: ~ onSubmit ~ values:", values);
    alert(JSON.stringify(values, null, 2));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-8"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Input placeholder="Enter your message" {...field} />
              </FormControl>
              <FormDescription>This message will be public.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

function ValidationFormDemo() {
  type ValidationFormData = z.infer<typeof validationFormSchema>;

  const form = useForm<ValidationFormData>({
    resolver: zodResolver(validationFormSchema),
    defaultValues: {
      name: "",
      age: 18,
      phone: "",
    },
  });

  function onSubmit(values: ValidationFormData) {
    console.log("ℹ️ XXX: ~ onSubmit ~ values:", values);
    alert(JSON.stringify(values, null, 2));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Age" {...field} />
              </FormControl>
              <FormDescription>
                You must be at least 18 years old.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Phone Number" {...field} />
              </FormControl>
              <FormDescription>
                Please enter a 10-11 digit number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

function ComplexFormDemo() {
  type ComplexFormData = z.infer<typeof complexFormSchema>;

  const form = useForm<ComplexFormData>({
    resolver: zodResolver(complexFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: 18,
      bio: "",
      terms: false,
    },
  });

  function onSubmit(values: ComplexFormData) {
    console.log("ℹ️ XXX: ~ onSubmit ~ values:", values);
    alert(JSON.stringify(values, null, 2));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-8"
      >
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Age" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Bio" {...field} />
              </FormControl>
              <FormDescription>
                Tell us a little bit about yourself.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-1 h-4 w-4"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Terms and Conditions</FormLabel>
                <FormDescription>
                  I agree to the terms and conditions.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

export const Basic: Story = {
  render: () => <BasicFormDemo />,
};

export const WithValidation: Story = {
  render: () => <ValidationFormDemo />,
};

export const Complex: Story = {
  render: () => <ComplexFormDemo />,
};
