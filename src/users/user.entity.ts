import { Column, Entity, JoinColumn, OneToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Address from '../address/address.entity';
import Post from '../posts/post.entity';

@Entity()
class User {
    @PrimaryGeneratedColumn()
    public id: string;

    @Column()
    public fullName: string;

    @Column()
    public email: string;

    @Column()
    public password: string;

    @Column()
    public twoFactorAuthenticationCode: string;

    @Column()
    public isTwoFactorAuthenticationEnabled: boolean;

    @OneToOne(() => Address, (address: Address) => address.user, {cascade: true, eager: true})
    @JoinColumn()
    public address: Address;

    @OneToMany(() => Post, (post: Post) => post.author)
    public posts: Post[];
}

export default User;