import Screen from '@/components/screen';
import {Form} from '@/components/ui/form.tsx';
import {useForm} from 'react-hook-form';
import {Input} from '@/components/ui/input.tsx';
import {Label} from '@/components/ui/label.tsx';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {Button} from '@/components/ui/button.tsx';
import useAuth from '@/hooks/use-auth.ts';
import {useMutation} from '@tanstack/react-query';
import {SignUpPayload} from '@/api/types.ts';
import {createAuthApi} from '@/api/auth.ts';
import {debounceValidator} from '@/lib/utils.ts';
import useAppStore from '@/stores/app.ts';

const api = createAuthApi();

const usernameDB = debounceValidator();
const emailDB = debounceValidator();

const schema = yup.object(
    {
      email: yup.string().email().required().test(async function (email: string) {
        if (!email) {
          return true;
        }
        const cb = (usr: string) => {
          return api.userExists({email: usr});
        };
        const fn = emailDB(cb, 500);
        const exists = (await fn(email)) as boolean;
        const err = this.createError({
          message: 'Email is already in use',
        });
        return exists ? err : true;
      }),
      username: yup.string().required().test(async function (username) {
        if (!username) {
          return true;
        }
        const cb = (usr: string) => {
          return api.userExists({username: usr});
        };
        const fn = usernameDB(cb, 500);
        const exists = (await fn(username)) as boolean;
        const err = this.createError({
          message: 'Username is already in use',
        });
        return exists ? err : true;
      }),
    }
);

export default function SignUpScreen() {
  const user = useAppStore().user;
  const auth = useAuth();
  const form = useForm({
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

  const mutation = useMutation({
    mutationKey: ["signUpForm"],
    mutationFn: auth.signUp
  });

  const onValid = async (props: Pick<SignUpPayload, "email" | "username" | "accepted_terms">) => {
    await mutation.mutateAsync({...props, accepted_terms: true});
    form.reset();
  };

  return (
      <Screen
          authenticatedRedirectTo={user?.is_creator === null ? "/onboarding/setup-initial-pool" : `/platform/${user!.username}`}>
        <div className="max-w-[600px] mx-auto">
          <h1 className="text-5xl text-center font-bold mt-14 text-gray-800">Create account.</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onValid as keyof object)}>
              <fieldset className="mt-14">
                <Label htmlFor="username" className="flex flex-col justify-start items-start">
                  <span>Username</span>
                  <Input type="text"
                         placeholder="john.doe" {...form.register("username")} />
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
              <div className="mt-4">
                <Button type="submit" disabled={mutation.isPending} className="w-full">Sign</Button>
              </div>
            </form>
          </Form>
        </div>
      </Screen>
  );
}