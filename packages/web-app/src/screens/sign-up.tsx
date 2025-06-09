import Screen from '../components/screen';
import {Form} from '@/components/ui/form.tsx';
import {useForm} from 'react-hook-form';
import {Input} from '@/components/ui/input.tsx';
import {Label} from '@/components/ui/label.tsx';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {Button} from '@/components/ui/button.tsx';
import useAuth from '@/hooks/use-auth.ts';
import {useMutation} from '@tanstack/react-query';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {SignUpPayload} from '@/api/types.ts';

const schema = yup.object(
    {
      email: yup.string().email().required(),
      username: yup.string().required(),
      accept_terms: yup.boolean().required(),
    }
);

export default function SignUpScreen() {
  const auth = useAuth();
  const form = useForm({
    resolver: yupResolver(schema),
  });
  const mutation = useMutation({
    mutationKey: ["signUpForm"],
    mutationFn: auth.signUp
  });

  const onValid = async (props: Pick<SignUpPayload, "email" | "username" | "accepted_terms">) => {
    mutation.mutate(props);
  };

  return (
      <Screen>
        <div className="max-w-[600px] mx-auto">
          <h1 className="text-5xl text-center font-bold mt-14 text-gray-800">Create account.</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onValid as keyof object)}>
              <fieldset className="mt-14">
                <Label htmlFor="username" className="flex flex-col justify-start items-start">
                  <span>Username</span>
                  <Input type="text" placeholder="john.doe" {...form.register("username")} />
                </Label>
                <p className="text-red-600 mt-1">{form.formState?.errors?.username?.message ?? ""}</p>
              </fieldset>
              <fieldset className="max-w-[600px] mx-auto mt-4">
                <Label htmlFor="email" className="flex flex-col justify-start items-start">
                  <span>Your Email</span>
                  <Input type="email" placeholder="e.g: john@gmail.com" {...form.register("email")} />
                </Label>
                <p className="text-red-600 mt-1">{form.formState?.errors?.email?.message ?? ""}</p>
              </fieldset>
              <fieldset className="flex gap-2">
                <Checkbox id="accept_terms" {...form.register("accept_terms")}/>
                <Label htmlFor="accept_terms">
                  Accept terms and conditions
                </Label>
              </fieldset>
              <div className="mt-4">
                <Button type="submit" disabled={mutation.isPending} className="w-full">Create account</Button>
              </div>
            </form>
          </Form>
        </div>
      </Screen>
  );
}